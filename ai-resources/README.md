# AI Resources for Card Info Base

This folder contains resources to help AI assistants understand and work with the Card Info Base project effectively.

## Contents

### 1. Schema Definitions

#### `card-schema-v4.json`
JSON Schema definition for Card objects (Schema Version 4).

**Purpose:** Type validation, documentation, and AI understanding of card structure.

**Key Fields:**
- Core: `id`, `title`, `body`, `parentId`, `children`
- Schema v4: `tags`, `meta`, `attributes`
- Timestamps: `createdAt`, `updatedAt`
- Mods: `modsData`

#### `store-schema-v4.json`
JSON Schema definition for the complete data store structure.

**Purpose:** Defines the overall storage format including cards and mods.

**Top-level Fields:**
- `rootOrder`: Array of root-level card IDs
- `cards`: Map of card IDs to Card objects
- `mods`: Map of mod IDs to ModData objects

### 2. Guidelines

#### `AI-GUIDELINES.md`
Comprehensive guidelines for AI assistants working on this project.

**Covers:**
- Project context and architecture
- Code modification best practices
- Schema v4 migration patterns
- Testing checklist
- Common pitfalls to avoid
- Versioning guidelines
- Road map awareness

## How to Use These Resources

### For AI Assistants

1. **Read `AI-GUIDELINES.md` first** to understand the project context
2. **Reference schemas** when working with data structures
3. **Follow patterns** shown in guidelines for consistency
4. **Check DEVELOPER.md** in the parent directory for API reference

### For Developers

1. **Update schemas** when data structures change
2. **Keep guidelines current** with project evolution
3. **Add examples** of common tasks and patterns
4. **Version schemas** when making breaking changes

## Schema Version History

### Version 4 (Current - 2025-11-11)
- Added `tags: string[]` field for categorization
- Added `meta: object` field for custom metadata
- Added `attributes: object` field for extensibility
- Automatic migration from v3 implemented

### Version 3 (Previous)
- Core hierarchical structure with `parentId` and `children`
- `modsData` field for mod system storage
- Timestamps: `createdAt` and `updatedAt`

## Validation

You can use these JSON schemas with various tools:

```bash
# Node.js with ajv
npm install ajv
node -e "const Ajv = require('ajv'); const ajv = new Ajv(); const schema = require('./card-schema-v4.json'); console.log(ajv.validateSchema(schema));"

# Online validators
# - https://www.jsonschemavalidator.net/
# - https://jsonschemalint.com/
```

## Contributing

When updating these resources:

1. **Increment schema version** if data structure changes
2. **Document changes** in this README
3. **Update AI-GUIDELINES.md** with new patterns
4. **Keep consistency** between schemas and actual code
5. **Test validation** with real data samples

## Related Documentation

- **[DEVELOPER.md](../DEVELOPER.md)** - Complete API reference and developer guide
- **[Road Map V1.md](../Road%20Map%20V1.md)** - Project roadmap and versioning strategy
- **[Card Info Base Version 0.7.html](../Card%20Info%20Base%20Version%200.7.html)** - Main application file

## License

Same as parent project: GNU General Public License v3.0

---

**Last Updated:** November 11, 2025  
**Schema Version:** 4  
**App Version:** 0.7.4.0
