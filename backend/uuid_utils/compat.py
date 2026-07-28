import time
import secrets
from uuid import UUID

_last_timestamp = 0
_counter = 0

def uuid7(timestamp: float | None = None, nanos: int | None = None) -> UUID:
    """
    Pure Python implementation of UUIDv7 as specified in RFC 9562.
    Safe from DLL injection or application control policies.
    """
    global _last_timestamp, _counter
    
    if timestamp is not None:
        ts_ms = int(timestamp * 1000)
        if nanos is not None:
            ts_ms += int(nanos / 1_000_000)
    else:
        ts_ms = int(time.time() * 1000)
        
    if ts_ms <= _last_timestamp:
        ts_ms = _last_timestamp
        _counter += 1
    else:
        _last_timestamp = ts_ms
        _counter = secrets.randbits(12)
        
    # Construct fields
    # 48-bit timestamp
    time_low = ts_ms >> 16
    time_mid = ts_ms & 0xFFFF
    
    # 12-bit counter with version 7
    time_hi_and_version = (_counter & 0x0FFF) | 0x7000
    
    # Variant and 62 bits random (variant is 0x8000 for variant 10)
    clock_seq = secrets.randbits(14) | 0x8000
    node = secrets.randbits(48)
    
    # Build standard UUIDv7 bytes
    uuid_bytes = bytearray()
    uuid_bytes.extend(time_low.to_bytes(4, byteorder='big'))
    uuid_bytes.extend(time_mid.to_bytes(2, byteorder='big'))
    uuid_bytes.extend(time_hi_and_version.to_bytes(2, byteorder='big'))
    uuid_bytes.extend(clock_seq.to_bytes(2, byteorder='big'))
    uuid_bytes.extend(node.to_bytes(6, byteorder='big'))
    
    return UUID(bytes=bytes(uuid_bytes))
