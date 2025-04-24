import { prompt } from 'enquirer';

export type Action = 'create' | 'update' | 'delete' | 'get' | 'list';

export type Choice<A extends Action> = {
  name: A;
  message: string;
};

export const defaultActionChoices = [
  { name: 'create', message: 'Create' },
  { name: 'update', message: 'Update' },
  { name: 'delete', message: 'Remove' },
  { name: 'get', message: 'Search by name' },
  { name: 'list', message: 'List all' },
] as const satisfies readonly Choice<Action>[];

export function pickActions<A extends Action>(
  allowed: readonly A[]
): readonly Choice<A>[] {
  return defaultActionChoices.filter((c): c is Choice<A> =>
    allowed.includes(c.name as A)
  );
}

export async function askAction<A extends Action = Action>(
  message: string,
  choices: readonly Choice<A>[] = defaultActionChoices as unknown as readonly Choice<A>[]
): Promise<A> {
  const { action } = await prompt<{ action: A }>({
    type: 'select',
    name: 'action',
    message,
    choices,
  });
  return action;
}
