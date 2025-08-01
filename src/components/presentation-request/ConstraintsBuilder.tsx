'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Code, Wand2, Eye, Copy, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ConstraintField {
  id: string;
  path: string;
  filterType: 'string' | 'number' | 'boolean' | 'array';
  operator: 'const' | 'enum' | 'minimum' | 'maximum' | 'pattern' | 'required' | 'contains';
  value: string;
  description?: string;
}

interface ConstraintsBuilderProps {
  value: string | Record<string, any> | undefined;
  onChange: (value: string | Record<string, any>) => void;
  error?: string;
}

export function ConstraintsBuilder({ value, onChange, error }: ConstraintsBuilderProps) {
  const [mode, setMode] = useState<'none' | 'builder' | 'json'>('none');
  const [jsonValue, setJsonValue] = useState('');
  const [fields, setFields] = useState<ConstraintField[]>([]);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Initialize from value
  useEffect(() => {
    if (!value) {
      setJsonValue('');
      setFields([]);
      setMode('none');
      return;
    }

    if (typeof value === 'string') {
      if (value.trim() === '') {
        setMode('none');
        setJsonValue('');
        setFields([]);
        return;
      }
      
      setJsonValue(value);
      setMode('json');
      try {
        const parsed = JSON.parse(value);
        parseConstraintsToFields(parsed);
      } catch (error) {
        console.warn('Failed to parse constraints JSON:', error);
        setFields([]);
      }
    } else {
      setJsonValue(JSON.stringify(value, null, 2));
      setMode('builder');
      parseConstraintsToFields(value);
    }
  }, [value]);

  // Update constraints when mode changes
  useEffect(() => {
    updateConstraints();
  }, [mode]);

  const parseConstraintsToFields = (constraints: Record<string, any>) => {
    const parsedFields: ConstraintField[] = [];
    
    if (constraints.fields && Array.isArray(constraints.fields)) {
      constraints.fields.forEach((field: any, index: number) => {
        if (field.path && field.filter) {
          const pathStr = Array.isArray(field.path) ? field.path.join('.') : field.path;
          const filter = field.filter;
          
          // Determine filter type and operator
          let filterType: ConstraintField['filterType'] = 'string';
          let operator: ConstraintField['operator'] = 'const';
          let value = '';

          if (filter.type) {
            filterType = filter.type as ConstraintField['filterType'];
          }

          if (filter.const !== undefined) {
            operator = 'const';
            value = String(filter.const);
          } else if (filter.enum !== undefined) {
            operator = 'enum';
            value = Array.isArray(filter.enum) ? filter.enum.join(', ') : String(filter.enum);
          } else if (filter.minimum !== undefined) {
            operator = 'minimum';
            value = String(filter.minimum);
          } else if (filter.maximum !== undefined) {
            operator = 'maximum';
            value = String(filter.maximum);
          } else if (filter.pattern !== undefined) {
            operator = 'pattern';
            value = String(filter.pattern);
          } else if (filter.contains !== undefined) {
            operator = 'contains';
            value = String(filter.contains);
          }

          parsedFields.push({
            id: `field-${index}`,
            path: pathStr.replace(/^\$\./, ''), // Remove $. prefix
            filterType,
            operator,
            value,
            description: field.purpose || field.description
          });
        }
      });
    }

    setFields(parsedFields);
  };

  const generateConstraintsFromFields = (): Record<string, any> => {
    if (fields.length === 0) {
      return {};
    }

    const constraintFields = fields.map(field => {
      const filter: Record<string, any> = {
        type: field.filterType
      };

      // Convert value based on operator
      let convertedValue: any = field.value;
      
      if (field.filterType === 'number') {
        convertedValue = parseFloat(field.value);
        if (isNaN(convertedValue)) convertedValue = 0;
      } else if (field.filterType === 'boolean') {
        convertedValue = field.value.toLowerCase() === 'true';
      } else if (field.operator === 'enum') {
        convertedValue = field.value.split(',').map(v => v.trim());
      }

      switch (field.operator) {
        case 'const':
          filter.const = convertedValue;
          break;
        case 'enum':
          filter.enum = convertedValue;
          break;
        case 'minimum':
          filter.minimum = convertedValue;
          break;
        case 'maximum':
          filter.maximum = convertedValue;
          break;
        case 'pattern':
          filter.pattern = convertedValue;
          break;
        case 'contains':
          filter.contains = convertedValue;
          break;
        case 'required':
          filter.required = true;
          break;
      }

      return {
        path: [`$.credentialSubject.${field.path}`],
        filter,
        ...(field.description && { purpose: field.description })
      };
    });

    return {
      fields: constraintFields
    };
  };

  const addField = () => {
    const newField: ConstraintField = {
      id: `field-${Date.now()}`,
      path: '',
      filterType: 'string',
      operator: 'const',
      value: ''
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    updateConstraints();
  };

  const updateField = (id: string, updates: Partial<ConstraintField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    setTimeout(updateConstraints, 100); // Debounce updates
  };

  const updateConstraints = () => {
    if (mode === 'none') {
      onChange('');
    } else if (mode === 'json') {
      onChange(jsonValue);
    } else {
      const generated = generateConstraintsFromFields();
      const jsonStr = Object.keys(generated).length > 0 ? JSON.stringify(generated, null, 2) : '';
      setJsonValue(jsonStr);
      onChange(jsonStr);
    }
  };

  const handleJsonChange = (newJsonValue: string) => {
    setJsonValue(newJsonValue);
    setJsonError(null);
    
    if (!newJsonValue.trim()) {
      onChange('');
      return;
    }

    try {
      const parsed = JSON.parse(newJsonValue);
      onChange(newJsonValue);
      parseConstraintsToFields(parsed);
    } catch (error) {
      setJsonError('Invalid JSON format');
      onChange(newJsonValue); // Still pass the value, let parent handle validation
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const loadTemplate = (template: string) => {
    let templateJson = '';
    switch (template) {
      case 'age':
        templateJson = JSON.stringify({
          fields: [{
            path: ["$.credentialSubject.age"],
            filter: { type: "number", minimum: 18 },
            purpose: "Age verification - must be 18 or older"
          }]
        }, null, 2);
        break;
      case 'country':
        templateJson = JSON.stringify({
          fields: [{
            path: ["$.credentialSubject.country"],
            filter: { type: "string", const: "VN" },
            purpose: "Location verification - must be Vietnam"
          }]
        }, null, 2);
        break;
      case 'degree':
        templateJson = JSON.stringify({
          fields: [{
            path: ["$.credentialSubject.degree"],
            filter: { type: "string", enum: ["Bachelor", "Master", "PhD"] },
            purpose: "Education level verification"
          }]
        }, null, 2);
        break;
      case 'multi':
        templateJson = JSON.stringify({
          fields: [
            {
              path: ["$.credentialSubject.age"],
              filter: { type: "number", minimum: 21 },
              purpose: "Must be 21 or older"
            },
            {
              path: ["$.credentialSubject.country"],
              filter: { type: "string", enum: ["VN", "US", "SG"] },
              purpose: "Must be from allowed countries"
            },
            {
              path: ["$.credentialSubject.verified"],
              filter: { type: "boolean", const: true },
              purpose: "Must be verified account"
            }
          ]
        }, null, 2);
        break;
    }
    
    if (templateJson) {
      setMode('json');
      handleJsonChange(templateJson);
      toast.success('Template loaded successfully!');
    }
  };

  const filterTypes = [
    { value: 'string', label: 'Text (string)' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'True/False (boolean)' },
    { value: 'array', label: 'List (array)' },
  ];

  const getOperatorsByType = (type: string) => {
    switch (type) {
      case 'string':
        return [
          { value: 'const', label: 'Equals exactly' },
          { value: 'enum', label: 'One of (list)' },
          { value: 'pattern', label: 'Matches pattern (regex)' },
          { value: 'contains', label: 'Contains text' },
        ];
      case 'number':
        return [
          { value: 'const', label: 'Equals exactly' },
          { value: 'minimum', label: 'At least (≥)' },
          { value: 'maximum', label: 'At most (≤)' },
          { value: 'enum', label: 'One of (list)' },
        ];
      case 'boolean':
        return [
          { value: 'const', label: 'Must be' },
        ];
      case 'array':
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'enum', label: 'One of' },
        ];
      default:
        return [{ value: 'const', label: 'Equals exactly' }];
    }
  };

  const getValuePlaceholder = (field: ConstraintField) => {
    switch (field.operator) {
      case 'const':
        if (field.filterType === 'boolean') return 'true or false';
        if (field.filterType === 'number') return 'e.g., 18';
        return 'e.g., Vietnam';
      case 'enum':
        return 'e.g., Bachelor, Master, PhD';
      case 'minimum':
        return 'e.g., 18';
      case 'maximum':
        return 'e.g., 65';
      case 'pattern':
        return 'e.g., ^[A-Z]{2}$ (regex pattern)';
      case 'contains':
        return 'e.g., University';
      default:
        return 'Enter value';
    }
  };

  const previewConstraints = () => {
    const generated = generateConstraintsFromFields();
    return Object.keys(generated).length > 0 ? JSON.stringify(generated, null, 2) : '{}';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <Info className="h-4 w-4" />
          Constraints Configuration
        </Label>
        <Tabs value={mode} onValueChange={(value) => setMode(value as 'none' | 'builder' | 'json')}>
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="none" className="flex items-center gap-2">
              <span className="text-sm">None</span>
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as 'none' | 'builder' | 'json')}>
        <TabsContent value="none" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                <Info className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Constraints</h3>
              <p className="text-muted-foreground text-center max-w-md">
                This credential will accept any presentation of the specified type without additional validation rules.
              </p>
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Less Secure</p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Without constraints, any valid credential of the specified type will be accepted, regardless of its content.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          {/* Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMode('none');
                    onChange('');
                    toast.success('No constraints applied');
                  }}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-medium">No Rules</span>
                  <span className="text-xs text-muted-foreground">Accept any</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate('age')}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-medium">Age 18+</span>
                  <span className="text-xs text-muted-foreground">Minimum age</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate('country')}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-medium">Location</span>
                  <span className="text-xs text-muted-foreground">Country check</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate('degree')}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-medium">Education</span>
                  <span className="text-xs text-muted-foreground">Degree level</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate('multi')}
                  className="h-auto p-3 flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-medium">Multi</span>
                  <span className="text-xs text-muted-foreground">Complex rules</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fields Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Constraint Rules</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addField}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </div>

            {fields.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    No constraint rules defined.<br />
                    Click "Add Rule" to create your first constraint.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Rule {index + 1}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Field Path</Label>
                          <Input
                            placeholder="e.g., age, country, degree"
                            value={field.path}
                            onChange={(e) => updateField(field.id, { path: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Path in credentialSubject (without $.credentialSubject.)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Data Type</Label>
                          <Select
                            value={field.filterType}
                            onValueChange={(value) => updateField(field.id, { 
                              filterType: value as ConstraintField['filterType'],
                              operator: 'const' // Reset operator when type changes
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {filterTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Condition</Label>
                          <Select
                            value={field.operator}
                            onValueChange={(value) => updateField(field.id, { operator: value as ConstraintField['operator'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getOperatorsByType(field.filterType).map(op => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm">Value</Label>
                          <Input
                            placeholder={getValuePlaceholder(field)}
                            value={field.value}
                            onChange={(e) => updateField(field.id, { value: e.target.value })}
                          />
                          {field.operator === 'enum' && (
                            <p className="text-xs text-muted-foreground">
                              Separate multiple values with commas
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Description (Optional)</Label>
                        <Input
                          placeholder="e.g., Must be 18 or older for age verification"
                          value={field.description || ''}
                          onChange={(e) => updateField(field.id, { description: e.target.value })}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Preview */}
            {fields.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Generated JSON
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(previewConstraints())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {previewConstraints()}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">JSON Constraints</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(jsonValue)}
                disabled={!jsonValue}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              placeholder='{"fields": [{"path": ["$.credentialSubject.age"], "filter": {"type": "number", "minimum": 18}}]}'
              value={jsonValue}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={8}
              className={`font-mono text-sm ${jsonError ? 'border-red-500' : ''}`}
            />
            {jsonError && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {jsonError}
              </p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Example constraints:</strong></p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Age verification:</strong> Requires minimum age of 18</li>
                <li><strong>Location verification:</strong> Must be from specific country</li>
                <li><strong>Education level:</strong> Degree must be Bachelor, Master, or PhD</li>
                <li><strong>Complex rules:</strong> Multiple constraints can be combined</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
