import numpy

import numpy.random

from typing import Optional

from pointcloud_viewer.pointcloud_viewer import DownSampleStrategy


def down_sample_pointcloud(pc: numpy.ndarray, strategy: DownSampleStrategy, args: Optional[list], max_num_points: int) -> numpy.ndarray:
    assert pc.shape[1] == 3 or pc.shape[1] == 4

    if pc.shape[0] <= max_num_points:
        return pc

    if strategy == strategy.NONE:
        return pc
    if strategy == strategy.RANDOM_SAMPLE:
        return down_sample_random(pc, max_num_points)
    if strategy == strategy.VOXEL_GRID:
        assert args is not None
        return down_sample_voxel(pc, args[0])

    assert False, "strategy not implemented: {0}".format(strategy.name)


def down_sample_random(pc: numpy.ndarray, max_num_points: int) -> numpy.ndarray:
    indices = numpy.arange(pc.shape[0])
    return pc[numpy.random.choice(indices, max_num_points)]

def down_sample_voxel(pc: numpy.ndarray, voxel_size: float) -> numpy.ndarray:
    scale = 1.0 / voxel_size
    voxels = {}
    output = []

    for i, _ in enumerate(pc):
        [x, y, z] = numpy.round(pc[i][:3] * scale).astype(numpy.int32)
        (p, n) = voxels.get((x, y, z), ((0.0, 0.0, 0.0, 0.0), 0))
        voxels[(x, y, z)] = (pc[i] + p, n + 1)

    for ((x, y, z), (acc, n)) in voxels.items():
        output.append(acc / n)

    output = numpy.array(output).astype(numpy.float32)
    # print("before", len(pc))
    # print("after", len(output))
    return output
