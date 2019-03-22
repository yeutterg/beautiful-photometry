# Docker Installation and Use

This Docker configuration allows you to keep dependencies independent of your host system (in a Docker container).
Note that the files are still run from the host, not copied to the container.

With Docker installed, clone the repository, and from the project root, run:

```console
docker build --tag beautiful-photometry .
```

To run the project and access the command line, run:

```console
sh run-docker.sh
```

To load the Jupyter Notebook server, run:

```console
sh run-docker.sh --jupyter
```

(or -j for short)

You will be able to access the Jupyter server at http://localhost:8888/ . The token will be provided by Jupyter from the command line.

To see running Docker containers:

```console
docker ps
```

To kill the Docker session:

```console
docker kill CONTAINER_ID
```