import { HttpStatus, type HttpStatusCode } from '@/lib/response.js';

type DbErrorShape = {
  code?: string;
  constraint?: string;
  message?: string;
  cause?: {
    code?: string;
    constraint?: string;
    message?: string;
  };
};

export type DbErrorRule = {
  code?: string;
  constraint?: string;
  messageIncludes?: string;
  responseMessage: string;
  status: HttpStatusCode;
};

export type MappedDbError = {
  message: string;
  status: HttpStatusCode;
};

const getErrorParts = (error: unknown) => {
  const dbError = error as DbErrorShape;
  const message = `${dbError.message ?? ''} ${dbError.cause?.message ?? ''}`.toLowerCase().trim();

  return {
    code: dbError.code ?? dbError.cause?.code,
    constraint: dbError.constraint ?? dbError.cause?.constraint,
    message
  };
};

export const mapDbError = (error: unknown, rules: DbErrorRule[]): MappedDbError | null => {
  const { code, constraint, message } = getErrorParts(error);

  for (const rule of rules) {
    if (rule.code && rule.code !== code) continue;
    if (rule.constraint && rule.constraint !== constraint) continue;
    if (rule.messageIncludes && !message.includes(rule.messageIncludes.toLowerCase())) continue;

    return {
      message: rule.responseMessage,
      status: rule.status
    };
  }

  return null;
};

export const tagGroupDbErrorRules = {
  create: [
    {
      code: '23505',
      constraint: 'uq_tag_groups_user_id_name',
      responseMessage: 'Tag group already exists',
      status: HttpStatus.CONFLICT
    },
    {
      messageIncludes: 'already exists',
      responseMessage: 'Tag group already exists',
      status: HttpStatus.CONFLICT
    },
    {
      messageIncludes: 'duplicate key value',
      responseMessage: 'Tag group already exists',
      status: HttpStatus.CONFLICT
    }
  ] satisfies DbErrorRule[]
};
