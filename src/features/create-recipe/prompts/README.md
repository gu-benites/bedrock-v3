# AI Prompts for Create Recipe Feature

This directory contains YAML-based prompt configurations for the Create Recipe AI streaming system. These prompts are used with the OpenAI Agents JS SDK to generate structured responses for different steps in the recipe creation flow.

## Overview

The Create Recipe feature uses a dynamic AI system that can handle multiple steps through configuration-driven prompts. Each step has its own YAML configuration file that defines:

- **Prompt Template**: The actual prompt sent to the AI model
- **Model Configuration**: Temperature, max tokens, and other model settings
- **JSON Schema**: Structure validation for AI responses
- **Metadata**: Version, description, and other configuration details

## Prompt Structure

Each YAML file follows this structure:

```yaml
# Metadata
name: "Step Name"
description: "Description of what this step does"
version: "1.0.0"

# Model configuration
model:
  name: "gpt-4"
  temperature: 0.7
  max_tokens: 2000

# JSON Schema for structured output
schema:
  type: "object"
  properties:
    data:
      type: "object"
      properties:
        step_data:
          type: "array"
          items:
            type: "object"
            properties:
              # Define the structure for each item
            required: ["required_fields"]
      required: ["step_data"]
  required: ["data"]

# Prompt template with variable substitution
prompt: |
  Your prompt template here.
  
  Use {{variable}} syntax for variable substitution.
  
  Health Concern: {{healthConcern}}
  Demographics: {{demographics}}
  
  Generate the response in the specified JSON format.
```

## Available Prompts

### Current Prompts

1. **potential-causes.yaml** - Generates potential causes based on health concern and demographics
   - Input: Health concern, demographics
   - Output: Array of potential causes with suggestions and explanations

### Future Prompts (Configured but not yet created)

2. **potential-symptoms.yaml** - Generates potential symptoms based on causes
   - Input: Health concern, demographics, selected causes
   - Output: Array of potential symptoms

3. **medical-properties.yaml** - Generates therapeutic properties
   - Input: Health concern, demographics, selected causes, selected symptoms
   - Output: Array of therapeutic properties with relevancy scores

## Variable Substitution

The prompt system supports Handlebars-style variable substitution:

### Simple Variables
```yaml
prompt: |
  Health Concern: {{healthConcern}}
  User Age: {{demographics.age}}
```

### Array Iteration
```yaml
prompt: |
  Selected Causes:
  {{#each selectedCauses}}
  - {{cause_name}}: {{cause_suggestion}}
  {{/each}}
```

### Conditional Blocks
```yaml
prompt: |
  {{#unless @last}}
  This is not the last item.
  {{/unless}}
```

## Data Transformation

The system automatically transforms AI responses from the recipe-wizard format to the create-recipe format:

### Recipe-Wizard Format (AI Output)
```json
{
  "data": {
    "potential_causes": [
      {
        "cause_id": "c1",
        "name_localized": "Chronic Stress",
        "suggestion_localized": "Work-related stress",
        "explanation_localized": "High stress levels can contribute to anxiety"
      }
    ]
  }
}
```

### Create-Recipe Format (Frontend Usage)
```json
[
  {
    "cause_name": "Chronic Stress",
    "cause_suggestion": "Work-related stress",
    "explanation": "High stress levels can contribute to anxiety"
  }
]
```

## Adding New Prompts

To add a new AI step:

1. **Create YAML file** in this directory following the structure above
2. **Add step configuration** in `src/features/create-recipe/config/step-mapping.ts`
3. **Add data transformation** if the output format differs
4. **Update store types** if new data structures are needed
5. **Test the prompt** with the generic step selector component

## Best Practices

### Prompt Writing
- **Be specific**: Clear instructions produce better results
- **Use examples**: Show the AI what you want
- **Define constraints**: Specify limits (e.g., "Generate 5-8 items")
- **Include context**: Provide relevant background information

### Model Configuration
- **Temperature**: 0.3-0.7 for structured outputs, higher for creative tasks
- **Max Tokens**: Set appropriate limits based on expected response size
- **Model Selection**: Use GPT-4 for complex reasoning, GPT-3.5 for simpler tasks

### Schema Design
- **Be explicit**: Define all required fields and types
- **Use descriptions**: Help the AI understand field purposes
- **Set constraints**: Use enums, patterns, and ranges where appropriate
- **Validate thoroughly**: Test with various inputs

## Testing Prompts

### Manual Testing
1. Use the generic step selector component
2. Test with various input combinations
3. Verify output format and quality
4. Check edge cases and error handling

### Automated Testing
- Prompt configurations are tested in `step-mapping.test.ts`
- Data transformations are validated automatically
- Integration tests cover the complete flow

## Troubleshooting

### Common Issues

1. **Prompt not loading**: Check file name matches step configuration
2. **Invalid YAML**: Validate YAML syntax and structure
3. **Schema validation errors**: Ensure AI output matches defined schema
4. **Variable substitution fails**: Check variable names and availability

### Debugging

1. **Check console logs**: Look for PromptManager errors
2. **Validate YAML**: Use online YAML validators
3. **Test variables**: Verify all template variables are provided
4. **Check file paths**: Ensure prompts directory structure is correct

## Performance Considerations

- **Caching**: Prompts are cached after first load
- **Preloading**: Available prompts are preloaded on startup
- **Template processing**: Variable substitution is optimized for performance
- **Memory management**: Cache is cleared when prompt paths change

## Security Notes

- **Input validation**: All template variables are validated
- **Output sanitization**: AI responses are processed and validated
- **Error handling**: Sensitive information is not exposed in errors
- **Access control**: Prompts are loaded server-side only

## Migration Notes

This prompt system was migrated from the recipe-wizard feature to support the create-recipe feature. Key changes:

- **Shared location**: Moved to `src/lib/ai/utils/prompt-manager.ts` for reusability
- **Dynamic loading**: Enhanced to support multiple features
- **Configuration-driven**: All step behavior is now configuration-based
- **Data transformation**: Automatic format conversion between systems

## Future Enhancements

Planned improvements:

1. **Prompt versioning**: Support for multiple prompt versions
2. **A/B testing**: Different prompts for testing and optimization
3. **Localization**: Multi-language prompt support
4. **Visual editor**: UI for creating and editing prompts
5. **Analytics**: Track prompt performance and effectiveness

## Support

For questions about prompt configuration:

1. Check this README for guidance
2. Review existing prompt files for examples
3. Test with the generic step selector component
4. Check the step mapping configuration
5. Refer to the OpenAI Agents JS SDK documentation

The prompt system is designed to be developer-friendly and maintainable. Following these guidelines will ensure your prompts integrate seamlessly with the Create Recipe AI system.
