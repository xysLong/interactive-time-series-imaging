from pyts.image import MarkovTransitionField
from pyts.image import GramianAngularField
import matplotlib.pyplot as plt
import numpy as np
import base64
import io


def mean_y_by_group_x(x, y):
    x_unique = np.unique(x)
    y_means = [np.mean(y[x == val]) for val in x_unique]
    return x_unique, y_means


def interpolate(data):
    x = np.array([d['x'] for d in data])
    y = np.array([-d['y'] for d in data])
    x_old, y_old = mean_y_by_group_x(x, y)
    x_new = np.arange(start=np.min(x_old), stop=np.max(x_old) + 1, step=1)
    y_new = np.interp(x_new, x_old, y_old)
    return x_new, y_new


def compute_image(y_new, plot_type):
    y_new = np.expand_dims(y_new, axis=0)
    if plot_type == 'gasf':
        method = GramianAngularField(method='summation')
    elif plot_type == 'gadf':
        method = GramianAngularField(method='difference')
    elif plot_type == 'mtf16':
        method = MarkovTransitionField(n_bins=16)
    else:
        method = MarkovTransitionField(n_bins=8)
    img = method.fit_transform(y_new)
    return img[0]  # type: ignore


def make_image(img, color_map):
    fig = plt.figure(frameon=False)
    fig.set_size_inches(5, 5, forward=False)
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    ax.set_axis_off()
    fig.add_axes(ax)
    ax.matshow(img, cmap=color_map)
    img_stream = io.BytesIO()
    plt.savefig(img_stream, format='png')
    plt.close()
    img_stream.seek(0)
    img_data = base64.b64encode(img_stream.read()).decode('utf-8')
    return img_data
