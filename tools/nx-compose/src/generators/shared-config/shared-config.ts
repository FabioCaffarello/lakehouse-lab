// tools/nx-compose/src/generators/shared-config/shared-config.ts
import { Tree, formatFiles } from '@nx/devkit';
import { join } from 'path';

import { askCreateProps } from './prompt';
import { SharedConfigGeneratorSchema } from './schema';

// Use‑Case & DTO
import { CreateSharedConfigUseCase } from '../../core/shared-config/application/use-cases/create-shared-config/create-shared-config.use-case';
import { CreateSharedConfigInput } from '../../core/shared-config/application/use-cases/create-shared-config/create-shared-config.input';
// Repositório em memória pra testes
import { SharedConfigInMemoryRepository } from '../../core/shared-config/infra/db/in-memory/shared-config-in-memory.repository';

export default async function sharedConfigGenerator(
  tree: Tree,
  schema: SharedConfigGeneratorSchema
) {
  // por enquanto só “create”
  const action = schema.action ?? 'create';
  if (action !== 'create') {
    console.warn(`Ação "${action}" não suportada (ainda só "create").`);
    return;
  }

  // monta o dir interno de templates
  const templatesDir = join(__dirname, 'files', 'templates');

  // pergunta TODOS os campos de criação
  const props = await askCreateProps(templatesDir);

  // instancia o DTO do Use‑Case
  const input = new CreateSharedConfigInput(props);

  // injeta repo + executa
  const repo = new SharedConfigInMemoryRepository();
  const uc = new CreateSharedConfigUseCase(repo);
  try {
    const output = await uc.execute(input);
    console.log('✅ SharedConfig criada:', output);
  } catch (err: any) {
    console.error('❌ Falha ao criar SharedConfig:', err.message);
  }

  await formatFiles(tree);
}
