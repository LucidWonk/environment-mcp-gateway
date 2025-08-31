# Golden Image Azure Blob Storage Sync Script
# This PowerShell script manages synchronization of golden image database backups
# with Azure Blob Storage for the Environment MCP Gateway

param(
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountName = $env:AZURE_STORAGE_ACCOUNT,
    
    [Parameter(Mandatory=$false)]
    [string]$StorageAccountKey = $env:AZURE_STORAGE_KEY,
    
    [Parameter(Mandatory=$false)]
    [string]$ContainerName = "mcp-golden-images",
    
    [Parameter(Mandatory=$false)]
    [string]$LocalBackupPath = "./backup",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("upload", "download", "list", "cleanup")]
    [string]$Operation = "upload",
    
    [Parameter(Mandatory=$false)]
    [int]$RetentionDays = 30,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Configuration
$ErrorActionPreference = "Stop"
$BlobPrefix = "golden-image"
$MetadataFile = "backup-metadata.json"

# Logging function
function Write-Log {
    param($Message, $Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$Timestamp] [$Level] $Message"
}

# Validate required parameters
function Test-Prerequisites {
    if (-not $StorageAccountName) {
        throw "Azure Storage Account name is required. Set AZURE_STORAGE_ACCOUNT environment variable or use -StorageAccountName parameter."
    }
    
    if (-not $StorageAccountKey) {
        throw "Azure Storage Account key is required. Set AZURE_STORAGE_KEY environment variable or use -StorageAccountKey parameter."
    }
    
    Write-Log "Prerequisites validated successfully"
}

# Initialize Azure Storage context
function Initialize-StorageContext {
    Write-Log "Initializing Azure Storage context"
    
    try {
        # Import Azure PowerShell modules if available
        if (Get-Module -ListAvailable -Name "Az.Storage") {
            Import-Module Az.Storage -Force
            $ctx = New-AzStorageContext -StorageAccountName $StorageAccountName -StorageAccountKey $StorageAccountKey
        } else {
            Write-Log "Az.Storage module not found. Using REST API fallback." "WARNING"
            $script:UseRestApi = $true
        }
        
        return $ctx
    }
    catch {
        Write-Log "Failed to initialize storage context: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Upload golden image backup to Azure
function Invoke-UploadOperation {
    param($StorageContext)
    
    Write-Log "Starting upload operation"
    
    if (-not (Test-Path $LocalBackupPath)) {
        throw "Local backup path does not exist: $LocalBackupPath"
    }
    
    $BackupFiles = Get-ChildItem -Path $LocalBackupPath -Filter "*.sql" -Recurse
    
    if ($BackupFiles.Count -eq 0) {
        Write-Log "No backup files found in $LocalBackupPath" "WARNING"
        return
    }
    
    foreach ($File in $BackupFiles) {
        $BlobName = "$BlobPrefix/$($File.Name)"
        
        if ($DryRun) {
            Write-Log "DRY RUN: Would upload $($File.FullName) to $BlobName"
        } else {
            try {
                Write-Log "Uploading $($File.Name) to Azure Blob Storage"
                
                if ($script:UseRestApi) {
                    # REST API fallback implementation
                    Invoke-RestApiUpload -FilePath $File.FullName -BlobName $BlobName
                } else {
                    Set-AzStorageBlobContent -File $File.FullName -Container $ContainerName -Blob $BlobName -Context $StorageContext -Force
                }
                
                Write-Log "Successfully uploaded $($File.Name)"
            }
            catch {
                Write-Log "Failed to upload $($File.Name): $($_.Exception.Message)" "ERROR"
                throw
            }
        }
    }
    
    # Upload metadata
    $Metadata = @{
        "timestamp" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        "environment" = $env:ENVIRONMENT ?? "development"
        "backup_count" = $BackupFiles.Count
        "operation" = "golden-image-backup"
    }
    
    $MetadataJson = $Metadata | ConvertTo-Json -Depth 3
    $MetadataPath = Join-Path $LocalBackupPath $MetadataFile
    $MetadataJson | Out-File -FilePath $MetadataPath -Encoding UTF8
    
    if (-not $DryRun) {
        $MetadataBlobName = "$BlobPrefix/$MetadataFile"
        if ($script:UseRestApi) {
            Invoke-RestApiUpload -FilePath $MetadataPath -BlobName $MetadataBlobName
        } else {
            Set-AzStorageBlobContent -File $MetadataPath -Container $ContainerName -Blob $MetadataBlobName -Context $StorageContext -Force
        }
        Write-Log "Metadata uploaded successfully"
    }
}

# Download golden image backup from Azure
function Invoke-DownloadOperation {
    param($StorageContext)
    
    Write-Log "Starting download operation"
    
    if (-not (Test-Path $LocalBackupPath)) {
        New-Item -ItemType Directory -Path $LocalBackupPath -Force | Out-Null
        Write-Log "Created local backup directory: $LocalBackupPath"
    }
    
    try {
        if ($script:UseRestApi) {
            $Blobs = Get-BlobsViaRestApi -Prefix $BlobPrefix
        } else {
            $Blobs = Get-AzStorageBlob -Container $ContainerName -Prefix $BlobPrefix -Context $StorageContext
        }
        
        foreach ($Blob in $Blobs) {
            $LocalPath = Join-Path $LocalBackupPath (Split-Path $Blob.Name -Leaf)
            
            if ($DryRun) {
                Write-Log "DRY RUN: Would download $($Blob.Name) to $LocalPath"
            } else {
                Write-Log "Downloading $($Blob.Name)"
                
                if ($script:UseRestApi) {
                    Invoke-RestApiDownload -BlobName $Blob.Name -LocalPath $LocalPath
                } else {
                    Get-AzStorageBlobContent -Container $ContainerName -Blob $Blob.Name -Destination $LocalPath -Context $StorageContext -Force
                }
                
                Write-Log "Successfully downloaded $($Blob.Name)"
            }
        }
    }
    catch {
        Write-Log "Download operation failed: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# List available backups
function Invoke-ListOperation {
    param($StorageContext)
    
    Write-Log "Listing available golden image backups"
    
    try {
        if ($script:UseRestApi) {
            $Blobs = Get-BlobsViaRestApi -Prefix $BlobPrefix
        } else {
            $Blobs = Get-AzStorageBlob -Container $ContainerName -Prefix $BlobPrefix -Context $StorageContext
        }
        
        Write-Host "`nAvailable Golden Image Backups:"
        Write-Host "================================"
        
        foreach ($Blob in $Blobs) {
            $Size = if ($Blob.Length) { "$([math]::Round($Blob.Length / 1MB, 2)) MB" } else { "Unknown" }
            $Modified = if ($Blob.LastModified) { $Blob.LastModified.ToString("yyyy-MM-dd HH:mm:ss") } else { "Unknown" }
            Write-Host "$($Blob.Name) - $Size - Modified: $Modified"
        }
    }
    catch {
        Write-Log "List operation failed: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Cleanup old backups
function Invoke-CleanupOperation {
    param($StorageContext)
    
    Write-Log "Starting cleanup operation (retention: $RetentionDays days)"
    
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    
    try {
        if ($script:UseRestApi) {
            $Blobs = Get-BlobsViaRestApi -Prefix $BlobPrefix
        } else {
            $Blobs = Get-AzStorageBlob -Container $ContainerName -Prefix $BlobPrefix -Context $StorageContext
        }
        
        $BlobsToDelete = $Blobs | Where-Object { $_.LastModified -lt $CutoffDate }
        
        if ($BlobsToDelete.Count -eq 0) {
            Write-Log "No blobs found older than $RetentionDays days"
            return
        }
        
        Write-Log "Found $($BlobsToDelete.Count) blobs to delete"
        
        foreach ($Blob in $BlobsToDelete) {
            if ($DryRun) {
                Write-Log "DRY RUN: Would delete $($Blob.Name)"
            } else {
                Write-Log "Deleting $($Blob.Name)"
                
                if ($script:UseRestApi) {
                    Remove-BlobViaRestApi -BlobName $Blob.Name
                } else {
                    Remove-AzStorageBlob -Container $ContainerName -Blob $Blob.Name -Context $StorageContext -Force
                }
            }
        }
        
        if (-not $DryRun) {
            Write-Log "Cleanup completed. Deleted $($BlobsToDelete.Count) old backups"
        }
    }
    catch {
        Write-Log "Cleanup operation failed: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# REST API fallback functions (simplified implementation)
function Invoke-RestApiUpload {
    param($FilePath, $BlobName)
    Write-Log "REST API upload not fully implemented - use Az.Storage module" "WARNING"
}

function Invoke-RestApiDownload {
    param($BlobName, $LocalPath)
    Write-Log "REST API download not fully implemented - use Az.Storage module" "WARNING"
}

function Get-BlobsViaRestApi {
    param($Prefix)
    Write-Log "REST API list not fully implemented - use Az.Storage module" "WARNING"
    return @()
}

function Remove-BlobViaRestApi {
    param($BlobName)
    Write-Log "REST API delete not fully implemented - use Az.Storage module" "WARNING"
}

# Main execution
try {
    Write-Log "Starting Golden Image Azure Sync - Operation: $Operation"
    
    if ($DryRun) {
        Write-Log "DRY RUN MODE - No actual operations will be performed" "WARNING"
    }
    
    Test-Prerequisites
    $StorageContext = Initialize-StorageContext
    
    switch ($Operation) {
        "upload" {
            Invoke-UploadOperation -StorageContext $StorageContext
        }
        "download" {
            Invoke-DownloadOperation -StorageContext $StorageContext
        }
        "list" {
            Invoke-ListOperation -StorageContext $StorageContext
        }
        "cleanup" {
            Invoke-CleanupOperation -StorageContext $StorageContext
        }
        default {
            throw "Invalid operation: $Operation"
        }
    }
    
    Write-Log "Golden Image Azure Sync completed successfully"
}
catch {
    Write-Log "Golden Image Azure Sync failed: $($_.Exception.Message)" "ERROR"
    exit 1
}