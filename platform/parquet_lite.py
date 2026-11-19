"""纯标准库的最小 Parquet 写入器。

只覆盖平台导出需要的场景：若干必填的 BYTE_ARRAY 列、不压缩、PLAIN 编码。
生成的是合法 Parquet 文件（PAR1 头尾 + Thrift CompactProtocol 元数据），
可以用 pyarrow / pandas / DuckDB 等标准读取器打开，不依赖任何第三方库。
"""
import struct


# Thrift CompactProtocol 类型编号
_T_I32 = 5
_T_I64 = 6
_T_BIN = 8
_T_LIST = 9
_T_STRUCT = 12
_T_BYTE_ARRAY = 6
_R_REQUIRED = 0
_ENC_PLAIN = 0
_ENC_RLE = 3


class _W:
    def __init__(self):
        self.b = bytearray()

    def byte(self, v):
        self.b.append(int(v) & 0xFF)

    def varint(self, v):
        v = int(v)
        while True:
            x = v & 0x7F
            v >>= 7
            if v:
                self.b.append(x | 0x80)
            else:
                self.b.append(x)
                return

    def zigzag(self, v, bits=64):
        v = int(v)
        self.varint(((v << 1) ^ (v >> (bits - 1))) & ((1 << bits) - 1))

    def binary(self, s):
        if isinstance(s, str):
            s = s.encode("utf-8")
        self.varint(len(s))
        self.b.extend(s)

    def field(self, fid, last, typ):
        delta = fid - last
        if 0 < delta <= 15:
            self.byte((delta << 4) | typ)
        else:
            self.byte(typ)
            self.zigzag(fid, 16)
        return fid

    def i32(self, fid, last, v):
        self.field(fid, last, _T_I32)
        self.zigzag(v, 32)
        return fid

    def i64(self, fid, last, v):
        self.field(fid, last, _T_I64)
        self.zigzag(v, 64)
        return fid

    def bin(self, fid, last, s):
        self.field(fid, last, _T_BIN)
        self.binary(s)
        return fid

    def list_head(self, etype, n):
        if n <= 14:
            self.byte((n << 4) | etype)
        else:
            self.byte(0xF0 | etype)
            self.varint(n)

    def struct(self, fid, last, fn):
        self.field(fid, last, _T_STRUCT)
        fn()
        self.byte(0)
        return fid


def _leaf_schema(name):
    w = _W()
    last = w.i32(1, 0, _T_BYTE_ARRAY)
    last = w.i32(3, last, _R_REQUIRED)
    last = w.bin(4, last, name)
    w.i32(6, last, 0)                    # ConvertedType.UTF8
    w.byte(0)
    return bytes(w.b)


def _root_schema(ncols):
    w = _W()
    last = w.bin(4, 0, "schema")
    w.i32(5, last, ncols)
    w.byte(0)
    return bytes(w.b)


def _page_header(nvalues, nbytes):
    w = _W()
    last = w.i32(1, 0, 0)               # PageType.DATA_PAGE
    last = w.i32(2, last, nbytes)       # uncompressed_page_size
    last = w.i32(3, last, nbytes)       # compressed_page_size

    def dph():
        a = w.i32(1, 0, nvalues)
        a = w.i32(2, a, _ENC_PLAIN)
        a = w.i32(3, a, _ENC_RLE)
        w.i32(4, a, _ENC_RLE)

    w.struct(5, last, dph)
    w.byte(0)                            # PageHeader 结束
    return bytes(w.b)


def _column_meta(name, nvalues, size, page_offset):
    w = _W()
    last = w.i32(1, 0, _T_BYTE_ARRAY)
    last = w.field(2, last, _T_LIST)
    w.list_head(_T_I32, 1)
    w.zigzag(_ENC_PLAIN, 32)
    last = w.field(3, last, _T_LIST)
    w.list_head(_T_BIN, 1)
    w.binary(name)
    last = w.i32(4, last, 0)             # Codec.UNCOMPRESSED
    last = w.i64(5, last, nvalues)
    last = w.i64(6, last, size)
    last = w.i64(7, last, size)
    w.i64(9, last, page_offset)          # data_page_offset
    w.byte(0)
    return bytes(w.b)


def _column_chunk(name, nvalues, size, page_offset):
    meta = _column_meta(name, nvalues, size, page_offset)
    w = _W()
    last = w.i64(2, 0, page_offset)      # file_offset（兼容旧读取器）
    w.field(3, last, _T_STRUCT)
    w.b.extend(meta)                     # meta 自身已带结构结束符
    w.byte(0)                            # ColumnChunk 结束
    return bytes(w.b)


def _row_group(chunks, total_size, nrows):
    w = _W()
    w.field(1, 0, _T_LIST)
    w.list_head(_T_STRUCT, len(chunks))
    for c in chunks:
        w.b.extend(c)
    last = w.i64(2, 1, total_size)
    w.i64(3, last, nrows)
    w.byte(0)
    return bytes(w.b)


def _file_meta(ncols, nrows, chunks, rg):
    w = _W()
    last = w.i32(1, 0, 1)                # version
    last = w.field(2, last, _T_LIST)
    w.list_head(_T_STRUCT, ncols + 1)
    w.b.extend(_root_schema(ncols))
    for name, _ in chunks:
        w.b.extend(_leaf_schema(name))
    last = w.i64(3, last, nrows)
    last = w.field(4, last, _T_LIST)
    w.list_head(_T_STRUCT, 1)
    w.b.extend(rg)
    w.bin(6, last, "tianshu-parquet-lite")
    w.byte(0)
    return bytes(w.b)


def write_parquet(path, columns, rows):
    """把 rows 写成 Parquet 文件。

    columns: 列名列表（全部按必填 UTF-8 字符串处理）
    rows: 二维序列，每行长度与 columns 一致；None 写成空串
    """
    if not columns:
        raise ValueError("至少需要一列")
    norm = []
    for r in rows:
        vals = list(r or [])
        if len(vals) < len(columns):
            vals += [""] * (len(columns) - len(vals))
        norm.append(["" if v is None else str(v) for v in vals[:len(columns)]])
    nrows = len(norm)
    out = bytearray(b"PAR1")
    chunks = []
    total = 0
    for ci, name in enumerate(columns):
        vals = [r[ci] for r in norm]
        data = bytearray()
        for v in vals:
            b = v.encode("utf-8")
            data.extend(struct.pack("<I", len(b)))
            data.extend(b)
        data = bytes(data)
        page_offset = len(out)
        hdr = _page_header(len(vals), len(data))
        out.extend(hdr)
        out.extend(data)
        size = len(hdr) + len(data)
        total += size
        chunks.append((name, _column_chunk(name, len(vals), size, page_offset)))
    rg = _row_group([c[1] for c in chunks], total, nrows)
    meta = _file_meta(len(columns), nrows, chunks, rg)
    out.extend(meta)
    out.extend(struct.pack("<I", len(meta)))
    out.extend(b"PAR1")
    with open(path, "wb") as f:
        f.write(out)
    return {"rows": nrows, "columns": len(columns), "bytes": len(out)}
