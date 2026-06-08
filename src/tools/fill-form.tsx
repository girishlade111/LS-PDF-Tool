'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFButton } from 'pdf-lib';
import { ToolPage } from '@/components/shared/tool-page';
import { useFileStore } from '@/store/file-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Type,
  CheckSquare,
  ChevronDown,
  CircleDot,
  MousePointerClick,
  Info,
  Download,
  RotateCcw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

type FieldType = 'text' | 'checkbox' | 'dropdown' | 'radio' | 'button';

interface FormFieldInfo {
  name: string;
  type: FieldType;
  currentValue: string;
  options?: string[];
  isChecked?: boolean;
  page?: number;
}

export function FillFormTool() {
  const { files, setProcessing, setProgress, setSuccess, setError } = useFileStore();
  const [formFields, setFormFields] = useState<FormFieldInfo[]>([]);
  const [originalFields, setOriginalFields] = useState<FormFieldInfo[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loadingFields, setLoadingFields] = useState(false);
  const [noFields, setNoFields] = useState(false);

  const loadFormFields = useCallback(async (fileData: ArrayBuffer) => {
    setLoadingFields(true);
    setNoFields(false);
    try {
      const pdfDoc = await PDFDocument.load(fileData, { ignoreEncryption: true });
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      if (fields.length === 0) {
        setNoFields(true);
        setFormFields([]);
        setOriginalFields([]);
        setFieldValues({});
        return;
      }

      const fieldInfos: FormFieldInfo[] = fields.map((field) => {
        const name = field.getName();

        if (field instanceof PDFTextField) {
          const value = field.getText() || '';
          return { name, type: 'text' as FieldType, currentValue: value };
        } else if (field instanceof PDFCheckBox) {
          const isChecked = field.isChecked();
          return {
            name,
            type: 'checkbox' as FieldType,
            currentValue: isChecked ? 'checked' : 'unchecked',
            isChecked,
          };
        } else if (field instanceof PDFDropdown) {
          const options = field.getOptions();
          const selected = field.getSelected();
          return {
            name,
            type: 'dropdown' as FieldType,
            currentValue: selected.length > 0 ? selected[0] : '',
            options,
          };
        } else if (field instanceof PDFRadioGroup) {
          const options = field.getOptions();
          const selected = field.getSelected();
          return {
            name,
            type: 'radio' as FieldType,
            currentValue: selected.length > 0 ? selected[0] : '',
            options,
          };
        } else if (field instanceof PDFButton) {
          return {
            name,
            type: 'button' as FieldType,
            currentValue: '(button)',
          };
        } else {
          return {
            name,
            type: 'text' as FieldType,
            currentValue: '',
          };
        }
      });

      setFormFields(fieldInfos);
      setOriginalFields(JSON.parse(JSON.stringify(fieldInfos)));

      const initialValues: Record<string, string> = {};
      fieldInfos.forEach((f) => {
        if (f.type === 'checkbox') {
          initialValues[f.name] = f.isChecked ? 'checked' : 'unchecked';
        } else {
          initialValues[f.name] = f.currentValue;
        }
      });
      setFieldValues(initialValues);
    } catch (err) {
      console.error('Error loading form fields:', err);
      setNoFields(true);
      setFormFields([]);
    } finally {
      setLoadingFields(false);
    }
  }, []);

  useEffect(() => {
    if (files.length > 0) {
      loadFormFields(files[0].data);
    } else {
      setFormFields([]);
      setOriginalFields([]);
      setFieldValues({});
      setNoFields(false);
    }
  }, [files, loadFormFields]);

  const updateFieldValue = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleResetFields = () => {
    const resetValues: Record<string, string> = {};
    originalFields.forEach((f) => {
      if (f.type === 'checkbox') {
        resetValues[f.name] = f.isChecked ? 'checked' : 'unchecked';
      } else {
        resetValues[f.name] = f.currentValue;
      }
    });
    setFieldValues(resetValues);
  };

  const handleFillAndDownload = async () => {
    if (files.length === 0) return;
    try {
      setProcessing('Filling form fields...');
      setProgress(20, 'Loading PDF document...');

      const pdfDoc = await PDFDocument.load(files[0].data, { ignoreEncryption: true });
      const form = pdfDoc.getForm();

      setProgress(50, 'Applying form values...');

      for (const fieldInfo of formFields) {
        try {
          const field = form.getField(fieldInfo.name);
          if (!field) continue;

          const value = fieldValues[fieldInfo.name] ?? '';

          if (field instanceof PDFTextField) {
            field.setText(value);
          } else if (field instanceof PDFCheckBox) {
            if (value === 'checked') {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field instanceof PDFDropdown) {
            if (value) {
              field.select(value);
            }
          } else if (field instanceof PDFRadioGroup) {
            if (value) {
              field.select(value);
            }
          }
          // PDFButton fields are not fillable
        } catch (fieldErr) {
          console.warn(`Could not fill field "${fieldInfo.name}":`, fieldErr);
        }
      }

      setProgress(80, 'Saving filled PDF...');
      const filledPdf = await pdfDoc.save();

      const blob = new Blob([filledPdf], { type: 'application/pdf' });
      setSuccess({
        blob,
        filename: `filled-${files[0].name}`,
        size: blob.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill form fields');
    }
  };

  const getTypeIcon = (type: FieldType) => {
    switch (type) {
      case 'text':
        return <Type className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
      case 'checkbox':
        return <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'dropdown':
        return <ChevronDown className="h-4 w-4 text-violet-600 dark:text-violet-400" />;
      case 'radio':
        return <CircleDot className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      case 'button':
        return <MousePointerClick className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: FieldType) => {
    switch (type) {
      case 'text':
        return 'Text';
      case 'checkbox':
        return 'Checkbox';
      case 'dropdown':
        return 'Dropdown';
      case 'radio':
        return 'Radio';
      case 'button':
        return 'Button';
    }
  };

  const getTypeBadgeColor = (type: FieldType) => {
    switch (type) {
      case 'text':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
      case 'checkbox':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'dropdown':
        return 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300';
      case 'radio':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      case 'button':
        return 'bg-muted text-muted-foreground';
    }
  };

  const fillableFields = formFields.filter((f) => f.type !== 'button');
  const buttonFields = formFields.filter((f) => f.type === 'button');

  return (
    <ToolPage
      toolId="fill-form"
      multiple={false}
      maxFiles={1}
      actionButton={
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={handleFillAndDownload}
            size="lg"
            className="w-full sm:w-auto"
            disabled={files.length === 0 || loadingFields || fillableFields.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Fill & Download PDF
          </Button>
          <Button
            onClick={handleResetFields}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            disabled={files.length === 0 || loadingFields || fillableFields.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Fields
          </Button>
        </div>
      }
    >
      {files.length > 0 && !loadingFields && !noFields && formFields.length > 0 && (
        <div className="space-y-4">
          {/* Info card */}
          <Card className="border-sky-200 dark:border-sky-800/40 bg-sky-50/50 dark:bg-sky-950/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-sky-900 dark:text-sky-200">
                    Fill in interactive form fields in your PDF
                  </p>
                  <p className="text-xs text-sky-700 dark:text-sky-300">
                    Works with text fields, checkboxes, dropdowns, and radio buttons. Fill in the values below and download your completed PDF.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fields count badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3">
              <MousePointerClick className="h-3.5 w-3.5" />
              {fillableFields.length} Fillable Field{fillableFields.length !== 1 ? 's' : ''} Found
            </Badge>
            {buttonFields.length > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                + {buttonFields.length} Button{buttonFields.length !== 1 ? 's' : ''} (read-only)
              </Badge>
            )}
          </div>

          {/* Fillable form fields */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {fillableFields.map((field, index) => (
              <Card
                key={field.name}
                className="animate-in fade-in slide-in-from-bottom-1 duration-300 hover:shadow-sm transition-shadow"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Field header */}
                    <div className="flex items-center gap-2">
                      {getTypeIcon(field.type)}
                      <Label className="text-sm font-medium flex-1 min-w-0 truncate" title={field.name}>
                        {field.name}
                      </Label>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getTypeBadgeColor(field.type)}`}>
                        {getTypeLabel(field.type)}
                      </Badge>
                    </div>

                    {/* Field input based on type */}
                    {field.type === 'text' && (
                      <Input
                        value={fieldValues[field.name] ?? ''}
                        onChange={(e) => updateFieldValue(field.name, e.target.value)}
                        placeholder="Enter value..."
                        className="text-sm"
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={fieldValues[field.name] === 'checked'}
                            onCheckedChange={(checked) =>
                              updateFieldValue(field.name, checked ? 'checked' : 'unchecked')
                            }
                          />
                          <Label className="text-sm text-muted-foreground cursor-pointer select-none">
                            {fieldValues[field.name] === 'checked' ? 'Checked' : 'Unchecked'}
                          </Label>
                        </div>
                        {field.currentValue && (
                          <span className="text-xs text-muted-foreground/60">
                            (original: {field.currentValue})
                          </span>
                        )}
                      </div>
                    )}

                    {field.type === 'dropdown' && field.options && field.options.length > 0 && (
                      <Select
                        value={fieldValues[field.name] ?? ''}
                        onValueChange={(val) => updateFieldValue(field.name, val)}
                      >
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="Select an option..." />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'radio' && field.options && field.options.length > 0 && (
                      <RadioGroup
                        value={fieldValues[field.name] ?? ''}
                        onValueChange={(val) => updateFieldValue(field.name, val)}
                        className="gap-2"
                      >
                        {field.options.map((opt) => (
                          <div key={opt} className="flex items-center gap-2">
                            <RadioGroupItem value={opt} id={`${field.name}-${opt}`} />
                            <Label
                              htmlFor={`${field.name}-${opt}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Read-only button fields */}
            {buttonFields.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Buttons (read-only, cannot be filled)
                </p>
                <div className="flex flex-wrap gap-2">
                  {buttonFields.map((field) => (
                    <Badge key={field.name} variant="outline" className="text-xs gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      {field.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {files.length > 0 && loadingFields && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">
            Reading form fields...
          </span>
        </div>
      )}

      {/* No form fields warning */}
      {files.length > 0 && !loadingFields && noFields && (
        <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  No form fields found
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This PDF does not contain any interactive form fields (AcroForm). Only PDFs with fillable form fields can be used with this tool.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </ToolPage>
  );
}
