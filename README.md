# FleetManager

Aplicativo mobile para gerenciamento de frotas de veículos, desenvolvido para a disciplina de **Programação para Dispositivos Móveis**.

O app permite controlar veículos, motoristas, abastecimentos e manutenções, com dashboard de gastos, alertas de revisão e exportação de relatórios.

## Funcionalidades

### Veículos
- Cadastro, edição e exclusão de veículos
- Controle de status: disponível, em uso e em manutenção
- Busca por placa (ignora hífen e maiúsculas/minúsculas)
- Filtro por status
- Vínculo com motorista ("Em uso por João")

### Motoristas
- Cadastro, edição e exclusão de motoristas (nome, CNH e telefone)
- Visualização dos veículos vinculados a cada motorista

### Manutenções
- Registro de manutenções com descrição, valor e quilometragem
- Total gasto por veículo
- Ordenação por data (mais recentes ou mais antigas)

### Abastecimentos
- Registro de litros, valor pago e quilometragem
- Cálculo do consumo médio (km/l)
- Atualização automática da quilometragem do veículo

### Dashboard
- Contadores de veículos por status
- Gasto total com manutenção e combustível
- Gráficos de gastos por mês e por veículo
- Alertas de veículos com muita quilometragem sem manutenção (limite padrão: 10.000 km)

### Extras
- Modo escuro (preferência salva no aparelho)
- Exportação de relatório da frota em texto (compartilhar) e em PDF
- Persistência local dos dados (funciona sem internet)

## Tecnologias

- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Expo](https://expo.dev/) (testado com Expo Go)
- [React Navigation](https://reactnavigation.org/) (Stack e Bottom Tabs)
-
