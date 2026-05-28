import { InfoIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { useImportArticles } from '@/features/import-articles/hooks/use-import-articles';

interface MapFieldsProps {
  onMappingComplete?: () => void;
}

type MappingKey = 'url' | 'title' | 'tags' | 'timeAdded';

type FieldToMap = {
  key: MappingKey;
  labelKey: string;
  required?: boolean;
  helpTextKey?: string;
};

const FIELDS_TO_MAP: FieldToMap[] = [
  { key: 'url', labelKey: 'import.mapFields.fieldUrl', required: true },
  { key: 'title', labelKey: 'import.mapFields.fieldTitle', required: true },
  {
    key: 'tags',
    labelKey: 'import.mapFields.fieldTags',
    helpTextKey: 'import.mapFields.helpText'
  },
  {
    helpTextKey: 'import.mapFields.helpText',
    key: 'timeAdded',
    labelKey: 'import.mapFields.fieldTimeAdded'
  }
];

function ColumnSelect({
  fieldsToMap,
  onValueChange,
  value
}: {
  fieldsToMap: { label: string; value: string | null }[];
  onValueChange: (value: string | null) => void;
  value: string | null;
}) {
  return (
    <Select items={fieldsToMap} onValueChange={onValueChange} value={value}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {fieldsToMap.map((column) => (
            <SelectItem key={column.label} value={column.value}>
              {column.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function MapFields({ onMappingComplete }: MapFieldsProps) {
  const { t } = useTranslation();
  const { mapping, onMappingChange, uploadedFile } = useImportArticles();

  const populateFields = (columns: string[]) => {
    const uploadedColumns = columns.map((column) => ({
      label: column,
      value: column
    }));

    return [{ label: t('import.mapFields.doNotMap'), value: null }, ...uploadedColumns];
  };

  const fieldsToMap = populateFields(uploadedFile.columns);

  useEffect(() => {
    if (mapping.url && mapping.title) {
      onMappingComplete?.();
    }
  }, [mapping.url, mapping.title, onMappingComplete]);

  return (
    <div className="flex max-w-350 flex-col gap-6">
      <div className="border-border bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('import.mapFields.articleFieldHeading')}</TableHead>
              <TableHead>{t('import.mapFields.csvColumnHeading')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FIELDS_TO_MAP.map((field) => (
              <TableRow key={field.key}>
                <TableCell className="flex items-center gap-2 py-4 text-sm font-semibold">
                  {t(field.labelKey)}
                  {field.required ? (
                    <Badge variant="info">{t('import.mapFields.required')}</Badge>
                  ) : null}
                  {field.helpTextKey ? (
                    <Tooltip>
                      <TooltipTrigger className="text-muted-foreground">
                        <InfoIcon size={16} weight="fill" />
                      </TooltipTrigger>
                      <TooltipContent>{t(field.helpTextKey)}</TooltipContent>
                    </Tooltip>
                  ) : null}
                </TableCell>
                <TableCell>
                  <ColumnSelect
                    fieldsToMap={fieldsToMap}
                    onValueChange={(value) => onMappingChange(field.key, value)}
                    value={mapping[field.key] || null}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
