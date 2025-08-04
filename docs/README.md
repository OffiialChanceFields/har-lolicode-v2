# OpenBullet 2 LoliCode Analyzer

## Overview
The OpenBullet 2 LoliCode Analyzer is a production-grade tool that converts HAR (HTTP Archive) files into executable LoliCode configurations for OpenBullet 2. It uses advanced analysis techniques to identify authentication flows, detect security tokens, and generate reliable configurations with minimal manual intervention.

## Key Features

### 1. Advanced Request Flow Analysis
- Temporal correlation analysis with microsecond precision
- Behavioral pattern recognition for common authentication flows
- State transition modeling across requests
- Critical path identification for essential request sequences

### 2. Intelligent Token Detection
- Multi-layer extraction covering 20+ token types
  - CSRF tokens, session tokens, JWT tokens, OAuth tokens
  - API keys, bearer tokens, form tokens, and more
- Contextual validation and cross-reference analysis
- Confidence scoring for token reliability

### 3. Production-Grade Code Generation
- Syntax-compliant LoliCode generation
- Optimized block structure with proper variable scoping
- Comprehensive error handling for authentication failures
- Support for multiple authentication patterns

### 4. Flexible Analysis Modes
- **AUTOMATIC**: Intelligent detection with minimal configuration
- **MANUAL**: Full user control over request selection
- **ASSISTED**: Balanced approach with guided analysis

## Architecture

### Core Components
- **Streaming HAR Parser**: Memory-efficient processing of large HAR files
- **Flow Analysis Engine**: Identifies request dependencies and authentication flows
- **Token Detection System**: Extracts and validates security tokens
- **Syntax Compliance Engine**: Generates valid LoliCode configurations
- **Pattern Library**: Contains 15+ authentication flow patterns

### Analysis Workflow
1. **HAR Parsing**: Stream the HAR file and extract network requests
2. **Request Scoring**: Score and filter requests based on relevance
3. **Token Detection**: Identify security tokens across multiple layers
4. **Flow Analysis**: Detect authentication patterns and dependencies
5. **Code Generation**: Generate optimized LoliCode with error handling

## Getting Started

### Installation
```bash
npm install ob2-lolicode-analyzer
```

### Basic Usage
```typescript
import { analyzeHarFile } from 'ob2-lolicode-analyzer';

const harContent = fs.readFileSync('example.har', 'utf-8');

analyzeHarFile(harContent)
  .then(result => {
    console.log('Generated LoliCode: