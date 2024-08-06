
from uuid import UUID


class DefaultUUID:
    CUSTOM_ROOT = UUID(int=0x0)
    ROOT = UUID(int=0x1)
    CONTROLS = UUID(int=0x2)
    CAMERA = UUID(int=0x3)
    ROTATE_SPEED = UUID(int=0x101)
    ZOOM_SPEED = UUID(int=0x102)
    PAN_SPEED = UUID(int=0x103)
    USE_PERSECTIVE = UUID(int=0x201)
