#!/usr/bin/env python3
"""Prints the CNAME target of a name using a raw DNS query (no dig/host/nslookup needed). Usage: cname-lookup.py NAME [RESOLVER]"""
import random, socket, struct, sys

def lookup(name, resolver="8.8.8.8"):
    qid = random.randint(0, 65535)
    q = struct.pack(">HHHHHH", qid, 0x0100, 1, 0, 0, 0)
    for label in name.rstrip(".").split("."):
        q += bytes([len(label)]) + label.encode()
    q += b"\x00" + struct.pack(">HH", 5, 1)  # QTYPE CNAME, QCLASS IN
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.settimeout(5)
    s.sendto(q, (resolver, 53)); data, _ = s.recvfrom(4096); s.close()
    if len(data) < 12 or struct.unpack(">H", data[:2])[0] != qid: return None

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
    for _ in range(an):
        _, pos = read_name(pos)
        rtype, _cls, _ttl, rdlen = struct.unpack(">HHIH", data[pos:pos + 10]); pos += 10
        if rtype == 5: return read_name(pos)[0]
        pos += rdlen
    return None

if __name__ == "__main__":
    try: print(lookup(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "8.8.8.8") or "")
    except Exception as e: print("", file=sys.stdout); print(f"lookup error: {e}", file=sys.stderr)
