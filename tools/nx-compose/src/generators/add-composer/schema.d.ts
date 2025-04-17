import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { SharedConfigGeneratorSchema } from './schema';
import { prompt } from 'enquirer';

export async function sharedConfigGenerator(
  tree: Tree,
  options: SharedConfigGeneratorSchema
) {
  const availableFields = ['name', 'email', 'age', 'isActive'];

  if (['get', 'delete', 'update'].includes(options.action) && !options.id) {
    const { id } = await prompt<{ id: string }>({
      type: 'input',
      name: 'id',
      message: 'Informe o ID do recurso:',
    });
    options.id = id;
  }

  if (['create', 'update'].includes(options.action)) {
    const { fields } = await prompt<{ fields: string[] }>([
      {
        type: 'multiselect',
        name: 'fields',
        message: 'Quais campos deseja incluir?',
        choices: availableFields,
      },
    ]);

    const detailedFields: { name: string; type: string }[] = [];

    for (const field of fields) {
      const { type } = await prompt<{ type: string }>({
        type: 'select',
        name: 'type',
        message: `Qual o tipo do campo "${field}"?`,
        choices: ['string', 'number', 'boolean'],
      });

      detailedFields.push({ name: field, type });
    }

    options.fields = detailedFields;
  }

  console.log('🚀 Options resolvidas:', options);

  // Aqui você pode chamar `generateFiles(...)`, `addProjectConfiguration(...)`, etc.
  // Por enquanto deixamos só o print

  await formatFiles(tree);
}

export default sharedConfigGenerator;
