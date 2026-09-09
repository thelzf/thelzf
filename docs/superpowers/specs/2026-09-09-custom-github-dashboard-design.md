# Dashboard personalizado do perfil GitHub

## Objetivo

Substituir o conjunto de widgets genéricos no topo do README por uma apresentação exclusiva do perfil `thelzf`, inspirada na arte neon fornecida. A solução deve mostrar a arte do desenvolvedor e estatísticas públicas reais, sem alterar o restante do README.

## Experiência visual

O topo terá duas peças:

1. Um hero com a arte do desenvolvedor de óculos, preparado para leitura em um README e armazenado em `assets/profile-hero.png`.
2. Um dashboard único em `assets/github-dashboard.svg`, com fundo preto-azulado, contornos azul-neon, tipografia de interface técnica e composição responsiva dentro da largura padrão do GitHub.

O dashboard mostrará:

- repositórios públicos;
- seguidores;
- estrelas recebidas nos repositórios públicos próprios;
- commits realizados no ano corrente;
- contribuições no ano corrente;
- distribuição das linguagens por tamanho reportado pelo GitHub;
- calendário anual de contribuições;
- horário da última atualização.

Os rótulos deixarão explícito o período dos números. Nenhum valor será apresentado como histórico total quando a API fornecer apenas o ano corrente.

## Componentes

### README

O bloco delimitado pelos comentários `github-dashboard:start` e `github-dashboard:end` será substituído. Ele exibirá o hero e o SVG gerado com caminhos relativos, mantendo todo o conteúdo que já existe depois desse bloco.

### Coleta e geração

O script `scripts/generate-dashboard.mjs` usará apenas APIs nativas do Node.js, sem dependências npm. Ele consultará a API GraphQL oficial do GitHub com `GITHUB_TOKEN`, paginará os repositórios públicos próprios e agregará estrelas e linguagens.

O mesmo pedido GraphQL fornecerá seguidores, contribuições, commits e o calendário do ano corrente. O script escapará todo texto inserido no SVG, limitará a quantidade de linguagens visíveis e gerará uma saída determinística para evitar commits sem mudanças reais.

Para permitir validação local sem acesso à API, o gerador aceitará um arquivo JSON por meio de `DASHBOARD_DATA_FILE`. Um fixture versionado será usado pelos testes.

### Automação

O workflow `.github/workflows/update-profile-dashboard.yml` executará diariamente e também poderá ser disparado manualmente. Ele terá permissão mínima `contents: write`, executará o gerador e criará um commit apenas quando `assets/github-dashboard.svg` mudar.

Commits feitos pelo workflow não causarão loop, pois os gatilhos serão somente `schedule` e `workflow_dispatch`.

## Dados e falhas

- A fonte de dados será exclusivamente a API oficial do GitHub.
- Repositórios que não pertencem ao usuário não entrarão na soma de estrelas e linguagens.
- Se a API falhar, o script terminará com código diferente de zero e preservará o último SVG válido já publicado.
- Se uma linguagem não tiver cor definida pela API, será usada uma cor neutra.
- O token não será escrito em arquivos, logs ou no SVG.
- A arte e o dashboard continuarão visíveis mesmo entre execuções da automação.

## Testes e validação

Um teste em `tests/generate-dashboard.test.mjs` executará o gerador com um fixture e verificará:

- presença dos indicadores esperados;
- escape de texto inserido no SVG;
- cálculo das porcentagens de linguagens;
- calendário com as intensidades recebidas;
- ausência de token ou valores de configuração sensíveis;
- saída idêntica em execuções repetidas com os mesmos dados.

Antes da publicação serão executados o teste do gerador, uma geração com dados reais, validação do XML do SVG, verificação do diff e inspeção visual do hero e do dashboard renderizado.

## Fora de escopo

- servidor próprio ou aplicação web hospedada;
- JavaScript executado dentro do README;
- métricas privadas;
- números históricos que não possam ser obtidos corretamente pela API;
- alterações no conteúdo atual abaixo do gadget.
