/* ============================================================================
   天枢 · 登录 / 首次改密页 逻辑（无框架、无构建）
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var ALERT_HOLD = null;

  function cookie(name) {
    var raw = document.cookie || "";
    var parts = raw.split(";");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split("=");
      if (kv[0].trim() === name) return decodeURIComponent((kv[1] || "").trim());
    }
    return "";
  }

  function api(path, options) {
    options = options || {};
    var headers = { "Accept": "application/json" };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    var method = (options.method || "GET").toUpperCase();
    if (method !== "GET") {
      var token = cookie("ls_csrf");
      if (token) headers["X-CSRF-Token"] = token;
    }
    var init = {
      method: method,
      headers: headers,
      credentials: "same-origin",
      cache: "no-store"
    };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    return fetch(path, init).then(function (res) {
      return res.json().catch(function () { return { code: res.status, message: "服务响应异常（HTTP " + res.status + "）" }; });
    }).catch(function () {
      return { code: -1, message: "网络异常，无法连接服务器" };
    });
  }

  function showAlert(el, msg, kind) {
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
    el.className = "auth-alert" + (kind ? " " + kind : "");
  }

  function busy(btn, on) {
    if (!btn) return;
    btn.disabled = !!on;
    var label = btn.querySelector(".btn-label");
    var spin = btn.querySelector(".btn-spin");
    if (label) label.style.opacity = on ? ".75" : "1";
    if (spin) spin.hidden = !on;
  }

  function safeNext() {
    try {
      var p = new URLSearchParams(location.search).get("next") || "";
      if (p && p.charAt(0) === "/" && p.charAt(1) !== "/" && p.indexOf("/login") !== 0) return p;
    } catch (e) { /* ignore */ }
    return "/";
  }

  function strength(pw) {
    var n = 0;
    if (pw.length >= 8) n++;
    if (pw.length >= 12) n++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) n++;
    return Math.min(4, Math.max(1, n));
  }

  /* ------------------------------------------------------------ 页面初始化 */
  function boot() {
    var ver = $("auth-version");
    var health = $("auth-health");
    api("/api/health").then(function (r) {
      if (r && r.code === 0 && r.data) {
        if (ver) ver.textContent = "v" + (r.data.version || "1.0.16");
        if (health) {
          health.textContent = r.data.db ? "服务正常 · 认证已启用" : "数据库异常";
          health.className = r.data.db ? "ok" : "warn";
        }
      } else if (health) {
        health.textContent = "服务状态未知";
        health.className = "warn";
      }
    });
    try {
      var saved = localStorage.getItem("ls_last_account");
      if (saved && $("account")) $("account").value = saved;
    } catch (e) { /* ignore */ }
    var force = /(?:^|[?&])force=1/.test(location.search);
    api("/api/auth/me").then(function (r) {
      if (r && r.code === 0 && r.data && r.data.user) {
        if (r.data.must_change || force) {
          enterPwdMode(r.data.user.account);
        } else {
          location.replace(safeNext());
        }
      }
    });
    if (force) setPwdMode(true);
    var pw = $("password");
    if (pw) pw.addEventListener("keyup", function (e) {
      var hint = $("caps-hint");
      if (!hint) return;
      try {
        var on = e.getModifierState && e.getModifierState("CapsLock");
        hint.hidden = !on;
      } catch (err) { /* ignore */ }
    });
    var toggle = $("pw-toggle");
    if (toggle) toggle.addEventListener("click", function () {
      var input = $("password");
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute("aria-label", show ? "隐藏密码" : "显示密码");
      input.focus();
    });
    var np = $("new-password");
    if (np) np.addEventListener("input", function () {
      var meter = $("pwd-meter");
      var txt = $("pwd-meter-text");
      if (!meter || !txt) return;
      var v = np.value;
      meter.hidden = !v;
      var s = strength(v);
      meter.className = "pwd-meter s" + s;
      txt.textContent = "强度：" + ["弱", "弱", "中", "强", "很强"][s];
    });
    var loginForm = $("login-form");
    if (loginForm) loginForm.addEventListener("submit", onLogin);
    var pwdForm = $("pwd-form");
    if (pwdForm) pwdForm.addEventListener("submit", onChangePwd);
  }

  /* ------------------------------------------------------------ 登录 */
  function onLogin(ev) {
    ev.preventDefault();
    var account = ($("account") && $("account").value || "").trim();
    var password = $("password") && $("password").value || "";
    var alertEl = $("auth-alert");
    if (!account) { showAlert(alertEl, "请输入账号"); $("account").focus(); return; }
    if (!password) { showAlert(alertEl, "请输入密码"); $("password").focus(); return; }
    showAlert(alertEl, "");
    var btn = $("login-btn");
    busy(btn, true);
    api("/api/auth/login", {
      method: "POST",
      body: { account: account, password: password, remember: !!($("remember") && $("remember").checked) }
    }).then(function (r) {
      busy(btn, false);
      if (!r || r.code !== 0) {
        var msg = (r && r.message) || "登录失败";
        showAlert(alertEl, msg + (r && r.code === 4012 ? "（连续错误 5 次将锁定 15 分钟）" : ""));
        return;
      }
      try { localStorage.setItem("ls_last_account", account); } catch (e) { /* ignore */ }
      var needPwd = r.data && (r.data.must_change || (r.data.user && r.data.user.must_change));
      if (needPwd) {
        enterPwdMode(account);
      } else {
        location.replace(safeNext());
      }
    });
  }

  /* ------------------------------------------------------------ 首次改密 */
  function setPwdMode(on) {
    var lf = $("login-form"), pf = $("pwd-form");
    if (lf) lf.hidden = !!on;
    if (pf) pf.hidden = !on;
    var title = $("auth-title"), desc = $("auth-desc");
    if (on) {
      if (title) title.textContent = "设置新密码";
      if (desc) desc.textContent = "为保障账号安全，首次登录必须修改初始密码";
    } else {
      if (title) title.textContent = "登录控制台";
      if (desc) desc.textContent = "使用平台账号登录，账号由管理员分配";
    }
  }

  function enterPwdMode(account) {
    setPwdMode(true);
    if ($("old-password")) $("old-password").value = "";
    if ($("new-password")) $("new-password").value = "";
    if ($("new-password2")) $("new-password2").value = "";
    var who = $("old-password");
    if (who && account) who.setAttribute("placeholder", "请输入当前密码（" + account + "）");
    var np = $("new-password");
    if (np) setTimeout(function () { np.focus(); }, 60);
  }

  function onChangePwd(ev) {
    ev.preventDefault();
    var alertEl = $("pwd-alert");
    var oldPw = ($("old-password") && $("old-password").value) || "";
    var np = ($("new-password") && $("new-password").value) || "";
    var np2 = ($("new-password2") && $("new-password2").value) || "";
    if (!oldPw) { showAlert(alertEl, "请输入当前密码"); return; }
    if (np.length < 8) { showAlert(alertEl, "新密码长度至少 8 位"); return; }
    var classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (re) { return re.test(np); }).length;
    if (classes < 3) { showAlert(alertEl, "新密码需包含大写字母、小写字母、数字、符号中的至少 3 类"); return; }
    if (np !== np2) { showAlert(alertEl, "两次输入的新密码不一致"); return; }
    if (np === oldPw) { showAlert(alertEl, "新密码不能与当前密码相同"); return; }
    showAlert(alertEl, "");
    var btn = $("pwd-btn");
    busy(btn, true);
    api("/api/auth/change-password", {
      method: "POST",
      body: { old: oldPw, new: np }
    }).then(function (r) {
      busy(btn, false);
      if (!r || r.code !== 0) {
        showAlert(alertEl, (r && r.message) || "修改失败，请重试");
        return;
      }
      showAlert(alertEl, "密码已更新，正在进入控制台…", "ok");
      location.replace(safeNext());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
