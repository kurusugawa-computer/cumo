import numpy

import numpy.random

from pointcloud_viewer.pointcloud_viewer import DownSampleStrategy


def down_sample_pointcloud(pc: numpy.ndarray, strategy: DownSampleStrategy, max_num_points: int) -> numpy.ndarray:
    assert pc.shape[1] == 3 or pc.shape[1] == 4

    if pc.shape[0] <= max_num_points:
        return pc

    if strategy == strategy.NONE:
        return pc
    if strategy == strategy.RANDOM_SAMPLE:
        return down_sample_random(pc, max_num_points)

    assert False, "strategy not implemented: {0}".format(strategy.name)


def down_sample_random(pc: numpy.ndarray, max_num_points: int) -> numpy.ndarray:
    indices = numpy.arange(pc.shape[0])
    return pc[numpy.random.choice(indices, max_num_points)]
