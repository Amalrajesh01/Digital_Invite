#!/usr/bin/env python3
"""Raw DNS query, no dig/host/nslookup needed. Prints the CNAME target (default) or every TXT value of a name, one per line.
Usage: cname-lookup.py NAME [RESOLVER] [CNAME|TXT]"""
import random, socket, struct, sys

def lookup(name, resolver="8.8.8.8", kind="CNAME"):
    qtype = {"CNAME": 5, "TXT": 16}[kind]
    qid = random.randint(0, 65535)
    q = struct.pack(">HHHHHH", qid, 0x0100, 1, 0, 0, 0)
    for label in name.rstrip(".").split("."):
        q += bytes([len(label)]) + label.encode()
    q += b"\x00" + struct.pack(">HH", qtype, 1)  # QCLASS IN
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.settimeout(5)
    s.sendto(q, (resolver, 53)); data, _ = s.recvfrom(4096); s.close()
    if len(data) < 12 or struct.unpack(">H", data[:2])[0] != qid: return []

    def read_name(pos):
        parts, jumped, end = [], False, pos
        while True:
            n = data[pos]
            if n == 0: pos += 1; break
            if n & 0xC0 == 0xC0:
                ptr = ((n & 0x3F) << 8) | data[pos + 1]
                if not jumped: end = pos + 2
                pos, jumped = ptr, True; continue
            parts.append(data[pos + 1:pos + 1 + n].decode()); pos += 1 + n
        return ".".join(parts), (end if jumped else pos)

    qd, an = struct.unpack(">HH", data[4:8]); pos = 12
    for _ in range(qd): _, pos = read_name(pos); pos += 4
    found = []
    for _ in range(an):
        _, pos = read_name(pos)
        rtype, _cls, _ttl, rdlen = struct.unpack(">HHIH", data[pos:pos + 10]); pos += 10
        if kind == "CNAME" and rtype == 5: return [read_name(pos)[0]]
        if kind == "TXT" and rtype == 16:  # one or more length-prefixed strings, joined
            i, txt = pos, b""
            while i < pos + rdlen: n = data[i]; txt += data[i + 1:i + 1 + n]; i += 1 + n
            found.append(txt.decode(errors="replace"))
        pos += rdlen
    return found

if __name__ == "__main__":
    try:
        for v in lookup(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "8.8.8.8", (sys.argv[3] if len(sys.argv) > 3 else "CNAME").upper()): print(v)
    except Exception as e: print(f"lookup error: {e}", file=sys.stderr)
