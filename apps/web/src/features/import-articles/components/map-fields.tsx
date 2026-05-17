import { InfoIcon } from '@phosphor-icons/react';
import { useEffect } from 'react';

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
  label: string;
  required?: boolean;
  helpText?: string;
};

const FIELDS_TO_MAP: FieldToMap[] = [
  { key: 'url', label: 'Article URL', required: true },
  { key: 'title', label: 'Title', required: true },
  {
    key: 'tags',
    label: 'Tags',
    helpText: 'Tags are optional and will be added to the article'
  },
  {
    helpText: 'Time Added helps preserve the order of articles when importing',
    key: 'timeAdded',
    label: 'Time Added'
  }
];

const populateFields = (columns: string[]) => {
  const uploadedColumns = columns.map((column) => ({
    label: column,
    value: column
  }));

  return [{ label: 'Do not map', value: null }, ...uploadedColumns];
};

function ColumnSelect({
  fieldsToMap,
  onValueChange,
  value
}: {
  fieldsToMap: ReturnType<typeof populateFields>;
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
  const { mapping, onMappingChange, uploadedFile } = useImportArticles();

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
              <TableHead>Expected Field</TableHead>
              <TableHead>Map to Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FIELDS_TO_MAP.map((field) => (
              <TableRow key={field.key}>
                <TableCell className="flex items-center gap-2 py-4 text-sm font-semibold">
                  {field.label}
                  {field.required ? <Badge variant="info">Required</Badge> : null}
                  {field.helpText ? (
                    <Tooltip>
                      <TooltipTrigger className="text-muted-foreground">
                        <InfoIcon size={16} weight="fill" />
                      </TooltipTrigger>
                      <TooltipContent>{field.helpText}</TooltipContent>
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
