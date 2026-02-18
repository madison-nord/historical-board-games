# Windows Environment Setup Best Practices

## Core Principle

**Always configure development tools permanently in system environment variables. Never rely on temporary session-only configurations.**

## The Problem We Solved

Development tools (Maven, Java, Node, etc.) that work "sometimes" but require daily reconfiguration indicate improper environment setup. This wastes time and creates frustration.

## Root Cause

When tools are added to PATH temporarily (via session commands like `$env:PATH = ...`), they disappear when:
- You close the terminal
- You start a new session
- The system restarts
- Kiro starts a new process

## The Solution: Permanent Environment Variables

### How to Set Environment Variables Permanently

Use PowerShell to set **User-level** environment variables (persists across all sessions):

```powershell
# Set a variable
[Environment]::SetEnvironmentVariable("VARIABLE_NAME", "C:\path\to\tool", "User")

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;C:\path\to\tool\bin", "User")
```

**Important**: Use `"User"` scope, not `"Machine"` (which requires admin rights).

### Refresh Current Session After Changes

After setting permanent variables, refresh the current session:

```powershell
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
$env:VARIABLE_NAME = [Environment]::GetEnvironmentVariable("VARIABLE_NAME", "User")
```

## Maven-Specific Setup

### Required Environment Variables

1. **M2_HOME**: Points to Maven installation directory
   ```powershell
   [Environment]::SetEnvironmentVariable("M2_HOME", "C:\tools\apache-maven-3.9.9", "User")
   ```

2. **PATH**: Must include Maven's bin directory
   ```powershell
   # Check if already in PATH
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   if ($currentPath -notlike "*apache-maven*") {
       [Environment]::SetEnvironmentVariable("Path", "$currentPath;C:\tools\apache-maven-3.9.9\bin", "User")
   }
   ```

### Finding Maven Installation

If Maven is installed but not in PATH, locate it:

```powershell
# Search for mvn.cmd
Get-ChildItem -Path "C:\" -Filter "mvn.cmd" -Recurse -ErrorAction SilentlyContinue -Depth 4 | Select-Object -First 5 FullName
```

Common locations:
- `C:\tools\apache-maven-*`
- `C:\Program Files\Apache\maven`
- `C:\Program Files\Maven`
- `%USERPROFILE%\apache-maven-*`

### Verify Maven Setup

```powershell
# Check environment variables
[Environment]::GetEnvironmentVariable("M2_HOME", "User")
[Environment]::GetEnvironmentVariable("Path", "User") -split ';' | Select-String -Pattern 'maven'

# Test Maven command
mvn --version
```

## Java-Specific Setup

### Required Environment Variables

1. **JAVA_HOME**: Points to JDK installation directory
   ```powershell
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-25.0.2", "User")
   ```

2. **PATH**: Must include Java's bin directory
   ```powershell
   $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
   if ($currentPath -notlike "*Java*jdk*") {
       [Environment]::SetEnvironmentVariable("Path", "$currentPath;C:\Program Files\Java\jdk-25.0.2\bin", "User")
   }
   ```

### Verify Java Setup

```powershell
# Check environment variables
[Environment]::GetEnvironmentVariable("JAVA_HOME", "User")

# Test Java command
java --version
javac --version
```

## Node.js and NPM Setup

### Required Environment Variables

Node.js installer typically handles PATH automatically, but verify:

```powershell
# Check if Node is in PATH
where.exe node
where.exe npm

# If not found, add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;C:\Program Files\nodejs", "User")
```

## Troubleshooting

### Tool Works in One Terminal But Not Another

**Symptom**: Command works in one PowerShell window but not in a new one.

**Cause**: Tool was added to `$env:PATH` temporarily in that session only.

**Solution**: Set the PATH permanently using `[Environment]::SetEnvironmentVariable()`.

### Tool Works Today But Not Tomorrow

**Symptom**: Tool works fine, but after restarting computer or IDE, it's not found.

**Cause**: Temporary environment variable that doesn't persist.

**Solution**: Set environment variables at User or Machine level, not session level.

### Changes Don't Take Effect

**Symptom**: Set environment variable but tool still not found.

**Cause**: Current session hasn't refreshed environment variables.

**Solution**: 
1. Close and reopen terminal/IDE, OR
2. Refresh current session with the refresh commands above

### Checking Current vs Permanent PATH

```powershell
# Current session PATH (may include temporary additions)
$env:Path

# Permanent User PATH (persists across sessions)
[Environment]::GetEnvironmentVariable("Path", "User")

# Permanent Machine PATH (system-wide, requires admin)
[Environment]::GetEnvironmentVariable("Path", "Machine")
```

## Best Practices Summary

1. **Always use permanent environment variables** for development tools
2. **Use User scope** for personal development tools (no admin required)
3. **Use Machine scope** only for system-wide tools (requires admin)
4. **Verify setup** after configuration with version commands
5. **Document locations** in project-specific steering files
6. **Never commit** environment-specific paths to version control
7. **Check before adding** - don't duplicate PATH entries

## When to Use Temporary Environment Variables

Temporary variables (`$env:VARIABLE = "value"`) are appropriate for:
- One-time experiments
- Testing different tool versions
- Overriding settings for a single command
- CI/CD pipeline-specific configurations

They are **NOT appropriate** for:
- Daily development tools (Maven, Java, Node, etc.)
- Tools required by the project
- Anything you need to work consistently

## Verification Checklist

After setting up a new tool, verify:

- [ ] Environment variable is set at User or Machine level
- [ ] PATH includes the tool's bin directory
- [ ] Tool command works in a NEW terminal window
- [ ] Tool command works after system restart
- [ ] Configuration is documented in project steering

## Project-Specific Configuration

For this Nine Men's Morris project:

- **Maven**: `C:\tools\apache-maven-3.9.9`
  - `M2_HOME`: `C:\tools\apache-maven-3.9.9`
  - PATH: `C:\tools\apache-maven-3.9.9\bin`

- **Java**: `C:\Program Files\Java\jdk-25.0.2`
  - `JAVA_HOME`: `C:\Program Files\Java\jdk-25.0.2`
  - PATH: `C:\Program Files\Java\jdk-25.0.2\bin`

These are now permanently configured and should work across all sessions.

---

**Remember**: Taking 5 minutes to configure tools properly saves hours of frustration and repeated fixes. Professional development environments are stable and reliable.
