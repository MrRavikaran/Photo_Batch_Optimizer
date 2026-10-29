import { OutputFormat } from '../types';

export function formatFilename(
  template: string,
  params: {
    originalName: string;
    width: number;
    height: number;
    format: OutputFormat;
    quality: number;
    presetName: string;
    index: number;
  }
): string {
  // Strip original extension
  const lastDot = params.originalName.lastIndexOf('.');
  const baseName = lastDot > 0 ? params.originalName.substring(0, lastDot) : params.originalName;
  
  // Clean base name for safe web filenames
  const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  const ext = params.format === 'jpeg' ? 'jpg' : params.format;
  const cleanPreset = params.presetName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  let result = template || '{name}-opt.{ext}';

  result = result
    .replace(/\{name\}/gi, safeName)
    .replace(/\{width\}/gi, String(params.width))
    .replace(/\{w\}/gi, String(params.width))
    .replace(/\{height\}/gi, String(params.height))
    .replace(/\{h\}/gi, String(params.height))
    .replace(/\{ext\}/gi, ext)
    .replace(/\{quality\}/gi, String(params.quality))
    .replace(/\{q\}/gi, String(params.quality))
    .replace(/\{preset\}/gi, cleanPreset)
    .replace(/\{index\}/gi, String(params.index + 1))
    .replace(/\{n\}/gi, String(params.index + 1).padStart(2, '0'));

  // Ensure result ends with correct extension
  if (!result.toLowerCase().endsWith(`.${ext}`)) {
    result = `${result}.${ext}`;
  }

  return result;
}

export interface TemplateTransformResult {
  newTemplate: string;
  error?: string;
}

export function transformFilenameTemplate(
  currentTemplate: string,
  search: string,
  replace: string,
  isRegex: boolean,
  caseSensitive: boolean
): TemplateTransformResult {
  if (!search) {
    return { newTemplate: currentTemplate };
  }

  try {
    if (isRegex) {
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(search, flags);
      const newTemplate = currentTemplate.replace(regex, replace);
      return { newTemplate };
    } else {
      if (caseSensitive) {
        const newTemplate = currentTemplate.split(search).join(replace);
        return { newTemplate };
      } else {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        const newTemplate = currentTemplate.replace(regex, replace);
        return { newTemplate };
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      newTemplate: currentTemplate,
      error: msg,
    };
  }
}

