# Beautiful Photometry

A set of tools to compute lighting photometric data and generate beautiful graphics.

For example, it can output a color spectrum showing the melanopic sensitivity curve:

![Color Spectrum](/out/daylight.png)

Or it can show a comparison among spectra:

![Spectral Comparison](/out/Traditional%20Source%20Comparison.png)

This is an early work in progress!

See also: [Beautiful Flicker](https://github.com/yeutterg/beautiful-flicker)

## Install and Use

### Local Version

Make sure you have Python installed in your environment. This only works with Python 3.5+.

Clone this repository, cd to the downloaded directory, and install necessary dependencies:

```console
pip install -r src/requirements.txt
```

To use Jupyter Notebooks, run from the root of this project:

```console
jupyter notebook examples/
```

### Docker Version

Alternatively, you can run this project in Docker. This is more likely to work across different systems.

Instructions for Docker are provided in [DOCKER.md](DOCKER.md)

## Use

### Running the Jupyter Notebook

To open the Jupyter Notebook, run:

```
jupyter notebook beautiful-photometry.ipynb
```

## License

Distributed under the [MIT license](/LICENSE).
