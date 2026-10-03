package main

import "time"

// WorkloadRuntime indicates the execution runtime: "docker" or "process" or "microvm"
type WorkloadRuntime string

const (
	RuntimeDocker  WorkloadRuntime = "docker"
	RuntimeProcess WorkloadRuntime = "process"
	RuntimeMicroVM WorkloadRuntime = "microvm"
)

// WorkloadStatus indicates the current health state
type WorkloadStatus string

const (
	StatusRunning  WorkloadStatus = "running"
	StatusStopped  WorkloadStatus = "stopped"
	StatusStarting WorkloadStatus = "starting"
	StatusError    WorkloadStatus = "error"
)

// WorkloadItem represents a unified workload visible in the Vuexy UI
type WorkloadItem struct {
	ID              string          `json:"id"`
	Name            string          `json:"name"`
	Description     string          `json:"description"`
	Runtime         WorkloadRuntime `json:"runtime"`
	Status          WorkloadStatus  `json:"status"`
	ImageOrRepo     string          `json:"imageOrRepo"`
	Port            int             `json:"port,omitempty"`
	Endpoint        string          `json:"endpoint,omitempty"`
	CPUUsage        float64         `json:"cpuUsage"`
	MemoryUsageMb   int             `json:"memoryUsageMb"`
	MemoryLimitMb   int             `json:"memoryLimitMb"`
	Uptime          string          `json:"uptime"`
	ColdStartTimeMs int             `json:"coldStartTimeMs,omitempty"`
	TTLRemaining    string          `json:"ttlRemaining,omitempty"`
	Logs            []string        `json:"logs"`
	CreatedAt       string          `json:"createdAt"`
	PID             int             `json:"pid,omitempty"`
	DockerID        string          `json:"dockerId,omitempty"`
	SourceType      string          `json:"sourceType"` // "docker_container", "host_process", "git", "compose"
}

// DockerContainerRaw represents output from `docker ps -a --format "{{json .}}"`
type DockerContainerRaw struct {
	ID         string `json:"ID"`
	Names      string `json:"Names"`
	Image      string `json:"Image"`
	State      string `json:"State"`
	Status     string `json:"Status"`
	Ports      string `json:"Ports"`
	RunningFor string `json:"RunningFor"`
	CreatedAt  string `json:"CreatedAt"`
}

// HostProcessInfo represents a monitored host process
type HostProcessInfo struct {
	PID          int     `json:"pid"`
	Name         string  `json:"name"`
	MemoryMB     float64 `json:"memoryMb"`
	CPUPercent   float64 `json:"cpuPercent"`
	Status       string  `json:"status"`
	CommandLine  string  `json:"commandLine,omitempty"`
	LastObserved time.Time
}

// DeployRequest handles deploying via Image, Git, Dockerfile, or Compose
type DeployRequest struct {
	Type              string            `json:"type"` // "image", "git", "dockerfile", "compose"
	Name              string            `json:"name"`
	Description       string            `json:"description"`
	Runtime           WorkloadRuntime   `json:"runtime"` // "docker" or "microvm"
	Image             string            `json:"image"`
	GitURL            string            `json:"gitUrl"`
	GitBranch         string            `json:"gitBranch"`
	DockerfileContent string            `json:"dockerfileContent"`
	ComposeContent    string            `json:"composeContent"`
	Port              int               `json:"port"`
	MemoryLimitMB     int               `json:"memoryLimitMb"`
	Env               map[string]string `json:"env"`
}

// ActionRequest for starting, stopping, restarting, or deleting workloads
type ActionRequest struct {
	Action string `json:"action"` // "start", "stop", "restart", "delete"
	ID     string `json:"id"`
}

// ClusterStats summary for dashboard telemetry
type ClusterStats struct {
	TotalWorkloads         int     `json:"totalWorkloads"`
	RunningWorkloads       int     `json:"runningWorkloads"`
	MicroVMCount           int     `json:"microVmCount"`
	DockerCount            int     `json:"dockerCount"`
	HostProcessCount       int     `json:"hostProcessCount"`
	TotalMemoryAllocatedMB int     `json:"totalMemoryAllocatedMb"`
	AvgColdStartMs         int     `json:"avgColdStartMs"`
	HypervisorStatus       string  `json:"hypervisorStatus"`
	DockerVersion          string  `json:"dockerVersion"`
	HostOS                 string  `json:"hostOs"`
	HostArch               string  `json:"hostArch"`
	TotalHostMemoryMB      float64 `json:"totalHostMemoryMb,omitempty"`
}
