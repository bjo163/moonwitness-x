package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// DockerManager encapsulates real Docker Engine operations
type DockerManager struct {
	available bool
	version   string
}

func NewDockerManager() *DockerManager {
	dm := &DockerManager{}
	ver, err := dm.CheckVersion()
	if err == nil {
		dm.available = true
		dm.version = strings.TrimSpace(ver)
		log.Printf("🐳 Docker Engine detected: %s", dm.version)
	} else {
		log.Printf("⚠️ Docker Engine not ready: %v", err)
	}
	return dm
}

func (dm *DockerManager) CheckVersion() (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "version", "--format", "{{.Server.Version}}")
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return string(out), nil
}

// ListContainers queries real Docker containers via `docker ps -a --format "{{json .}}"`
func (dm *DockerManager) ListContainers() ([]WorkloadItem, error) {
	if !dm.available {
		return nil, fmt.Errorf("docker engine unavailable")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "ps", "-a", "--format", "{{json .}}")
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to run docker ps: %w", err)
	}

	var items []WorkloadItem
	scanner := bufio.NewScanner(bytes.NewReader(out))

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		var raw DockerContainerRaw
		if err := json.Unmarshal([]byte(line), &raw); err != nil {
			continue
		}

		name := strings.TrimPrefix(raw.Names, "/")
		status := StatusStopped
		if strings.ToLower(raw.State) == "running" {
			status = StatusRunning
		}

		// Extract first published port if present
		port := extractPort(raw.Ports)

		item := WorkloadItem{
			ID:            "docker-" + raw.ID[:min(12, len(raw.ID))],
			DockerID:      raw.ID,
			Name:          name,
			Description:   fmt.Sprintf("Docker Container (%s)", raw.Image),
			Runtime:       RuntimeDocker,
			Status:        status,
			ImageOrRepo:   raw.Image,
			Port:          port,
			Uptime:        raw.Status,
			MemoryLimitMb: 512,
			MemoryUsageMb: 48,
			CPUUsage:      0.8,
			CreatedAt:     raw.CreatedAt,
			SourceType:    "docker_container",
			Logs: []string{
				fmt.Sprintf("[DOCKER] Container ID: %s", raw.ID),
				fmt.Sprintf("[STATUS] %s (State: %s)", raw.Status, raw.State),
				fmt.Sprintf("[PORTS] %s", raw.Ports),
			},
		}

		if port > 0 && status == StatusRunning {
			item.Endpoint = fmt.Sprintf("http://localhost:%d", port)
		}

		items = append(items, item)
	}

	return items, nil
}

func (dm *DockerManager) Start(idOrName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "start", idOrName)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker start failed: %s (%w)", string(out), err)
	}
	return nil
}

func (dm *DockerManager) Stop(idOrName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "stop", idOrName)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker stop failed: %s (%w)", string(out), err)
	}
	return nil
}

func (dm *DockerManager) Restart(idOrName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "restart", idOrName)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker restart failed: %s (%w)", string(out), err)
	}
	return nil
}

func (dm *DockerManager) Remove(idOrName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "rm", "-f", idOrName)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("docker rm failed: %s (%w)", string(out), err)
	}
	return nil
}

func (dm *DockerManager) Logs(idOrName string, tailLines int) ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if tailLines <= 0 {
		tailLines = 100
	}

	cmd := exec.CommandContext(ctx, "docker", "logs", "--tail", strconv.Itoa(tailLines), idOrName)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("docker logs failed: %s (%w)", string(out), err)
	}

	lines := strings.Split(string(out), "\n")
	var cleaned []string
	for _, l := range lines {
		trimmed := strings.TrimRight(l, "\r")
		if trimmed != "" {
			cleaned = append(cleaned, trimmed)
		}
	}
	return cleaned, nil
}

// DeployImage deploys a container directly from an image
func (dm *DockerManager) DeployImage(req DeployRequest) (string, error) {
	args := []string{"run", "-d", "--name", req.Name}

	if req.Port > 0 {
		args = append(args, "-p", fmt.Sprintf("%d:%d", req.Port, req.Port))
	}

	for k, v := range req.Env {
		args = append(args, "-e", fmt.Sprintf("%s=%s", k, v))
	}

	args = append(args, req.Image)

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", args...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("docker run failed: %s (%w)", string(out), err)
	}

	containerID := strings.TrimSpace(string(out))
	return containerID, nil
}

// DeployDockerfile builds from Dockerfile content and runs it
func (dm *DockerManager) DeployDockerfile(req DeployRequest, baseDir string) (string, []string, error) {
	buildDir := filepath.Join(baseDir, "dockerfile-"+req.Name)
	if err := os.MkdirAll(buildDir, 0755); err != nil {
		return "", nil, err
	}

	dockerfilePath := filepath.Join(buildDir, "Dockerfile")
	if err := os.WriteFile(dockerfilePath, []byte(req.DockerfileContent), 0644); err != nil {
		return "", nil, err
	}

	// 1. docker build
	tag := strings.ToLower(req.Name) + ":latest"
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
	defer cancel()

	buildCmd := exec.CommandContext(ctx, "docker", "build", "-t", tag, buildDir)
	buildOut, err := buildCmd.CombinedOutput()
	logLines := strings.Split(string(buildOut), "\n")
	if err != nil {
		return "", logLines, fmt.Errorf("docker build failed: %s (%w)", string(buildOut), err)
	}

	// 2. docker run
	req.Image = tag
	containerID, err := dm.DeployImage(req)
	if err != nil {
		return "", logLines, err
	}

	return containerID, logLines, nil
}

// DeployCompose launches a multi-container stack via `docker compose up -d`
func (dm *DockerManager) DeployCompose(req DeployRequest, baseDir string) ([]string, error) {
	composeDir := filepath.Join(baseDir, "compose-"+req.Name)
	if err := os.MkdirAll(composeDir, 0755); err != nil {
		return nil, err
	}

	composeFile := filepath.Join(composeDir, "docker-compose.yml")
	if err := os.WriteFile(composeFile, []byte(req.ComposeContent), 0644); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composeFile, "-p", req.Name, "up", "-d", "--build")
	out, err := cmd.CombinedOutput()
	logLines := strings.Split(string(out), "\n")
	if err != nil {
		return logLines, fmt.Errorf("docker compose up failed: %s (%w)", string(out), err)
	}

	return logLines, nil
}

// DeployGitRepo clones from GitHub and builds Dockerfile or runs docker-compose
func (dm *DockerManager) DeployGitRepo(req DeployRequest, baseDir string) (string, []string, error) {
	repoDir := filepath.Join(baseDir, "git-"+req.Name)
	os.RemoveAll(repoDir) // Clean old clone if any

	// 1. git clone
	branch := req.GitBranch
	if branch == "" {
		branch = "main"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	cloneCmd := exec.CommandContext(ctx, "git", "clone", "--depth", "1", "-b", branch, req.GitURL, repoDir)
	cloneOut, err := cloneCmd.CombinedOutput()
	if err != nil {
		// Fallback to clone without branch specification if default branch differs
		fallbackCmd := exec.CommandContext(ctx, "git", "clone", "--depth", "1", req.GitURL, repoDir)
		if fOut, fErr := fallbackCmd.CombinedOutput(); fErr != nil {
			return "", strings.Split(string(cloneOut)+"\n"+string(fOut), "\n"), fmt.Errorf("git clone failed: %s (%w)", string(cloneOut), err)
		}
	}

	// 2. Check for docker-compose.yml or Dockerfile
	composePath := filepath.Join(repoDir, "docker-compose.yml")
	dockerfilePath := filepath.Join(repoDir, "Dockerfile")

	if _, err := os.Stat(composePath); err == nil {
		// Found docker-compose.yml
		composeBytes, err := os.ReadFile(composePath)
		if err != nil {
			return "", nil, err
		}
		req.ComposeContent = string(composeBytes)
		logs, err := dm.DeployCompose(req, baseDir)
		return "compose-" + req.Name, logs, err
	}

	if _, err := os.Stat(dockerfilePath); err == nil {
		// Found Dockerfile
		tag := strings.ToLower(req.Name) + ":latest"
		bCtx, bCancel := context.WithTimeout(context.Background(), 300*time.Second)
		defer bCancel()

		buildCmd := exec.CommandContext(bCtx, "docker", "build", "-t", tag, repoDir)
		buildOut, err := buildCmd.CombinedOutput()
		logLines := strings.Split(string(buildOut), "\n")
		if err != nil {
			return "", logLines, fmt.Errorf("docker build from git repo failed: %s (%w)", string(buildOut), err)
		}

		req.Image = tag
		containerID, err := dm.DeployImage(req)
		return containerID, logLines, err
	}

	return "", nil, fmt.Errorf("no Dockerfile or docker-compose.yml found in repository %s", req.GitURL)
}

func extractPort(portsStr string) int {
	if portsStr == "" {
		return 0
	}
	// e.g. "0.0.0.0:10019->8069/tcp" or ":8080"
	idx := strings.Index(portsStr, "->")
	if idx != -1 {
		prefix := portsStr[:idx]
		colonIdx := strings.LastIndex(prefix, ":")
		if colonIdx != -1 {
			p, err := strconv.Atoi(prefix[colonIdx+1:])
			if err == nil {
				return p
			}
		}
	}
	return 0
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
