"""Reference solution for Exercise 03: Repository Cloning.

This solution demonstrates the expected learner actions for cloning
the Agentic-AI-Platform repository.
"""

# Expected submission for a passing repository clone
PASSING_SUBMISSION = {
    "clone_path": "/opt/Agentic-AI-Platform",
    "repo_url": "https://forgejo.example.com/opcp/opcp-storeai.git",
    "files_present": [
        "docker-compose.yml",
        "Dockerfile",
        "requirements.txt",
        "app.py",
        "env_setup.sh",
        "README.md",
    ],
    "dirs_present": [
        "src",
        "labs",
        "skillhub",
        "nginx",
    ],
    "is_git_repo": True,
}

# Commands the learner should run
CLONE_COMMANDS = """
# Create target directory
sudo mkdir -p /opt/Agentic-AI-Platform

# Clone the repository
sudo git clone https://forgejo.example.com/opcp/opcp-storeai.git /opt/Agentic-AI-Platform

# Set ownership to current user
sudo chown -R $USER:$USER /opt/Agentic-AI-Platform

# Navigate to the directory
cd /opt/Agentic-AI-Platform

# Verify the clone
ls -la
git status
"""
