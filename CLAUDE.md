# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LootCode is a LeetCode practice app built as a single-file React component (`leetcode-app.jsx`, ~1500 lines). It provides an interactive study flow: browse problems → read description → answer MCQs → solve code puzzles (drag-and-drop block arrangement).

## Architecture

The entire app lives in `leetcode-app.jsx` — a self-contained React component with no build tool, no package.json, and no external bundler config. It uses inline styles (no CSS files).

### Key structure within the file:
- **SAMPLE_PROBLEMS** — hardcoded problem data (id, title, difficulty, description, examples, constraints, MCQs, code puzzles)
- **PROMPT_TEMPLATE** — LLM prompt template for generating new problems in the app's JSON format
- **Component hierarchy**: `LootCodeApp` (root) → `ProblemView` (read phase) → `MCQPhase` (quiz) → `CodePuzzle` (drag-and-drop puzzle)
- **ImportModal** — allows importing new problems via JSON paste
- **Shared style objects** at bottom (`btnPrimary`, `btnSmall`, `microBtn`)

### App flow (state machine):
`home` (problem list) → `read` (problem description) → `quiz` (MCQ questions) → `puzzle` (code block arrangement) → back to `home`

### Data persistence:
Problems are stored in-memory via React state. New problems can be imported through the ImportModal using the JSON format defined in PROMPT_TEMPLATE.

## Development

No build system exists. The JSX file is intended to be used within a React environment (e.g., embedded in a larger app or used with a bundler). It imports only from `"react"`.
