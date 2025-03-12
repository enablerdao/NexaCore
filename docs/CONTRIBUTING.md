# Contributing to NexaCore

Thank you for your interest in contributing to NexaCore! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to foster an inclusive and respectful community.

## How to Contribute

### Reporting Bugs

If you find a bug, please report it by creating an issue on our GitHub repository. When reporting bugs, please include:

1. A clear and descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Environment information (OS, Rust version, etc.)

### Suggesting Enhancements

We welcome suggestions for enhancements! Please create an issue on our GitHub repository with:

1. A clear and descriptive title
2. A detailed description of the proposed enhancement
3. Any relevant examples or mockups
4. Explanation of why this enhancement would be valuable

### Pull Requests

We actively welcome pull requests:

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Add or update tests as necessary
5. Ensure all tests pass
6. Update documentation as needed
7. Submit a pull request

#### Pull Request Guidelines

- Follow the coding style and conventions used in the project
- Write clear, descriptive commit messages
- Include tests for new features or bug fixes
- Update documentation as necessary
- Keep pull requests focused on a single change
- Link the pull request to any related issues

## Development Setup

### Prerequisites

- Rust 1.60+
- Node.js 16+
- RocksDB

### Building from Source

```bash
# Clone the repository
git clone https://github.com/enablerdao/NexaCore.git
cd NexaCore

# Build the project
cargo build

# Run tests
cargo test
```

## Coding Standards

### Rust Code

- Follow the [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `rustfmt` to format your code
- Use `clippy` to catch common mistakes and improve your code
- Write documentation comments for public API
- Aim for comprehensive test coverage

### JavaScript Code

- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ESLint to check your code
- Write clear and concise comments
- Include unit tests for new functionality

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

## Documentation

- Update the README.md with details of changes to the interface
- Update the API documentation for any modified endpoints
- Maintain clear and comprehensive documentation for all public APIs

## Testing

- Write unit tests for all new code
- Ensure all tests pass before submitting a pull request
- Include integration tests for new features
- Consider edge cases and error conditions

## Contribution Recognition

All contributors will be acknowledged in our CONTRIBUTORS.md file. Your contributions help make NexaCore better for everyone!

## Questions?

If you have any questions about contributing, please reach out to the maintainers or create an issue on GitHub.