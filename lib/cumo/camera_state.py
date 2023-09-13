from enum import Enum
from dataclasses import dataclass
from cumo._internal.protobuf import client_pb2


class Vector3f:
    x: float
    y: float
    z: float

    def __init__(self, v: client_pb2.VecXYZf):
        self.x = v.x
        self.y = v.y
        self.z = v.z

    def __str__(self) -> str:
        return f"{self.__class__.__name__}({self.x}, {self.y}, {self.z})"


class CameraMode(Enum):
    PERSPECTIVE = 1
    ORTHOGRAPHIC = 2

    @staticmethod
    def _FromProtobuf(m: client_pb2.CameraState.CameraMode):
        if m == client_pb2.CameraState.CameraMode.PERSPECTIVE:
            return CameraMode.PERSPECTIVE
        return CameraMode.ORTHOGRAPHIC


@dataclass
class CameraState:
    position: Vector3f
    target: Vector3f
    up: Vector3f
    mode: CameraMode
    roll_lock: bool
    fov: float
    frustum_height: float

    def __str__(self) -> str:
        return f"{self.__class__.__name__}(position={self.position}, target={self.target}," \
            + f" up={self.up}, mode={self.mode}, roll_lock={self.roll_lock}," \
            + f" fov={self.fov}, frustum_height={self.frustum_height})"
