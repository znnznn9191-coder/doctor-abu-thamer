# Provider architecture for the research platform

## Overview
The internal research workflow is intentionally provider-agnostic. Research stages do not call a vendor-specific API or a concrete model directly. Instead, they interact with a shared model service that resolves the active provider at runtime.

## Provider interface
The provider contract lives in:
- backend/providers/provider_interface.js

Required behavior:
- each provider must expose a name
- each provider must implement generate()
- the interface is stable and can be used by future providers without changing the research modules

## Default provider
The current default is the deterministic local provider:
- backend/providers/local_provider.js

It remains the safe default because it:
- works without credentials
- is deterministic
- keeps the workflow local and inspectable
- supports future provider extension without changing the research modules

## Registry
The provider registry is in:
- backend/providers/provider_registry.js

It manages:
- registration of providers
- selection of the active default provider
- a clean fallback to local when no external provider is configured

## Model service
The shared access layer is:
- backend/services/model_service.js

This service:
- resolves the active provider
- exposes a stable generateStageOutput() interface
- accepts a stage name plus context
- supports staged fallback behavior
- prevents research modules from depending on vendor-specific logic

## Adding a future provider
To add another provider later:
1. Create a new file under backend/providers/
2. Extend the provider interface contract
3. Implement generate({ stage, context, fallback })
4. Register it in provider_registry.js
5. Set DEFAULT_PROVIDER in backend/config.js when needed

Example flow:
- module calls modelService.generateStageOutput(...)
- model service resolves the active provider from the registry
- provider generates a structured result or falls back to local behavior
- research logic continues with the same interface regardless of provider implementation

## Credential handling
Credentials, API keys, and remote connection settings remain internal configuration only.
They should later live in environment variables or a secure internal config file, not in the public UI or research modules.

## Provider independence in modules
Research modules keep their logic focused on:
- framing the problem
- reviewing evidence
- organizing methodology
- processing academic structure

They do not include vendor-specific names, API calls, or hard-coded provider details.

## Fallback behavior
When no external provider is configured:
- the registry selects the local provider
- the model service returns a deterministic local result
- the workflow continues normally without breaking the application
