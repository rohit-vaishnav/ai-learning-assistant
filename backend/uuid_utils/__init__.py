# Pure Python mock of uuid_utils to bypass native DLL load blocks
from .compat import uuid7
__all__ = ["uuid7"]
