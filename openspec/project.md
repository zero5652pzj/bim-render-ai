# Project Context

## Purpose
**bim-render-ai** is a project focused on Building Information Modeling (BIM) with AI-powered rendering capabilities. The project aims to:
- Process and handle architectural/engineering BIM data
- Provide visualization and rendering services for BIM models
- Integrate AI/ML capabilities for automated rendering optimization and enhancement
- Enable intelligent 3D model processing and visualization workflows

## Tech Stack

### Frontend
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI 组件**: TDesign Vue Next
- **AI 集成**: Vercel AI SDK (`ai`, `@ai-sdk/vue`)

### Backend / Database
- **认证**: Supabase Auth
- **数据库**: Supabase PostgreSQL
- **实时功能**: Supabase Realtime
- **文件存储**: Supabase Storage
- **API 层**: Vercel Functions (Edge Runtime)

### 3D Visualization
- **待定**: 正在评估 Three.js、Babylon.js、Autodesk Forge 等方案

### 开发工具
- **包管理**: pnpm
- **代码规范**: ESLint + TypeScript
- **规范管理**: OpenSpec (spec-driven development)
- **部署**: Vercel

> 📖 **完整的强制性技术标准请参阅**: [TECHNICAL_STANDARDS.md](./TECHNICAL_STANDARDS.md)

## Project Conventions

### Code Style
*To be defined based on chosen tech stack*
Will follow industry best practices for the selected languages and frameworks.

### Architecture Patterns
*To be determined based on requirements*
Potential patterns:
- Microservices architecture for scalability
- Plugin-based system for extensibility
- Event-driven architecture for processing pipelines

### Testing Strategy
*To be established*
Will include:
- Unit tests for core logic
- Integration tests for API endpoints
- 3D rendering validation tests
- AI model accuracy testing
- Performance benchmarks

### Git Workflow
- Branch strategy: Feature branches from main
- Commit conventions: Conventional Commits (feat:, fix:, docs:, etc.)
- PR requirements: Code review, tests passing
- Deployment: Continuous integration pipeline

## Domain Context

### BIM (Building Information Modeling)
- **IFC Format**: Industry Foundation Classes standard for BIM data exchange
- **Model Components**: Walls, floors, doors, windows, structural elements
- **Metadata**: Properties, materials, dimensions, relationships
- **File Formats**: .ifc, .rvt, .nwc, and other proprietary formats

### Rendering & Visualization
- **3D Visualization**: Real-time rendering of architectural models
- **Web-based**: Browser-compatible rendering for accessibility
- **Performance**: Efficient handling of large, complex models
- **Interactivity**: User controls for viewing, sectioning, annotation

### AI/ML Integration
- **Automated Rendering**: AI-powered camera positioning and lighting
- **Style Transfer**: Apply architectural styles to models
- **Optimization**: Performance optimization based on view complexity
- **Classification**: Automated categorization of model elements

## Important Constraints
- **Performance**: Large BIM files (100MB+) must load efficiently
- **Browser Compatibility**: Web-based solution should work across modern browsers
- **File Size**: Optimize 3D models for web delivery
- **Accuracy**: Maintain geometric and dimensional accuracy from source BIM data
- **Standards Compliance**: Support IFC and other relevant BIM standards

## External Dependencies
*To be populated as project evolves*
Potential dependencies:
- BIM file parsers (IFC.js, IfcOpenShell, etc.)
- 3D rendering libraries (Three.js, Babylon.js)
- AI/ML frameworks (PyTorch, TensorFlow)
- Cloud storage for model files
- CDN for optimized asset delivery
