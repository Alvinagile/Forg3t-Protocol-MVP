from setuptools import setup, find_packages

setup(
    name="forg3t-sdk",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "huggingface_hub>=0.20.0",
        "requests>=2.31.0",
    ],
    entry_points={
        "console_scripts": [
            "forg3t=forg3t.cli:main",
        ],
    },
    author="Forg3t Team",
    description="Forg3t SDK for AI unlearning with Hugging Face CLI integration",
    python_requires=">=3.8",
)