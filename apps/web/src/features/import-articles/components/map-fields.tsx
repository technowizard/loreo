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

const populateFields = (columns: string[]) => {
  const uploadedColumns = columns.map((column) => ({
    label: column,
    value: column
  }));

  return [{ label: 'Do not map', value: null }, ...uploadedColumns];
};

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
            <TableRow>
              <TableCell className="flex items-center gap-2 py-4 text-sm font-semibold">
                Article URL
                <Badge variant="info">Required</Badge>
              </TableCell>
              <TableCell>
                <Select
                  items={fieldsToMap}
                  onValueChange={(value) => onMappingChange('url', value)}
                  value={mapping.url || null}
                >
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
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center gap-2 py-4 text-sm font-semibold">
                Title
                <Badge variant="info">Required</Badge>
              </TableCell>
              <TableCell>
                <Select
                  items={fieldsToMap}
                  onValueChange={(value) => onMappingChange('title', value)}
                  value={mapping.title || null}
                >
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
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center gap-2 py-4 text-sm font-semibold">
                Tags
                <Tooltip>
                  <TooltipTrigger className="text-muted-foreground">
                    <InfoIcon size={16} weight="fill" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Tags are optional and will be added to the article
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Select
                  items={fieldsToMap}
                  onValueChange={(value) => onMappingChange('tags', value)}
                  value={mapping.tags || null}
                >
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
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="flex items-center gap-2 py-4 text-sm font-semibold">
                Time Added
                <Tooltip>
                  <TooltipTrigger className="text-muted-foreground">
                    <InfoIcon size={16} weight="fill" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Time Added helps preserve the order of articles when importing
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Select
                  items={fieldsToMap}
                  onValueChange={(value) => onMappingChange('timeAdded', value)}
                  value={mapping.timeAdded || null}
                >
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
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
