# Use Ubuntu 22.04 LTS as base image
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18

# Install basic dependencies including Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    make \
    python3 \
    python3-pip \
    graphviz \
    mscgen \
    plantuml \
    default-jre-headless \
    libgtk-3-0 \
    libgtk-3-dev \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libxrandr2 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    chromium-browser \
    fonts-liberation \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18 (modern version as per setup.sh)
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs

# Install Python diagram tools (blockdiag, actdiag, nwdiag, seqdiag)
RUN pip3 install blockdiag actdiag nwdiag seqdiag

# Create app directory
WORKDIR /app

# Create Puppeteer config for Docker (no sandbox)
RUN echo 'module.exports = {\n\
  launch: {\n\
    dumpio: false,\n\
    headless: true,\n\
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]\n\
  }\n\
};' > jest-puppeteer.config.cjs

# Copy package files first for better caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Build the project
RUN make

# Default command (can be overridden)
CMD ["bash"]