// just short examples for every used library

import process from 'process';
import dotenv from 'dotenv';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import got from 'got'; // https://github.com/sindresorhus/got/issues/2267
import MarkdownIt from 'markdown-it';
import { readFileSync } from 'fs';

// had to disable it due to incompatibility with moduleResolution option. See issue above.
// eslint-disable-next-line import/extensions
import assert from 'assert';
import { DOMParser } from 'linkedom';
import FormData from 'form-data';
import { constants as HttpConstants } from 'http2';
import { ExamplesTypes } from '@examples/enums/ExamplesTypes';

// ///////////////////////
// LOGGERS
// ///////////////////////

function printTestHeader(exampleType: ExamplesTypes): void {
  console.log('\n');
  console.log('// ///////////////////////');
  console.log(`// ${exampleType as string} TEST`);
  console.log('// ///////////////////////');
}

function printTestFooter(exampleType: ExamplesTypes): void {
  console.log(`✅  ${exampleType as string} PASSED`);
}

// ///////////////////////
// ACTUAL TESTS
// ///////////////////////
async function httpExample(): Promise<void> {
  printTestHeader(ExamplesTypes.HTTP_REQUEST);

  // GET /plugins is an endpoint which requires authentication. If this request returns 401, credentials
  // in .env file are invalid
  const response = await got(`${process.env.WP_URL as string}/wp-json/wp/v2/plugins?_fields=name`, {
    username: process.env.WP_API_USERNAME,
    password: process.env.WP_API_PASSWORD,
    responseType: 'json'
  });

  const plugins = response.body as Array<{ name: string }>;
  assert(response.statusCode === HttpConstants.HTTP_STATUS_OK, '❌  HTTP Request failed!');
  assert(plugins.length, '❌  Plugins are not fetched!');

  console.log('✔️  Http request properly fetched');
  printTestFooter(ExamplesTypes.HTTP_REQUEST);
}

function dotenvExample(): void {
  printTestHeader(ExamplesTypes.DOTENV_CONFIG);

  const getEnvironmentValue = (envPropertyKey: string): void => {
    const valueFromEnv: string | undefined = process.env[envPropertyKey];
    assert(valueFromEnv != null, `❌  ${envPropertyKey} is missing!`);
    console.log(`✔️  Value for ${envPropertyKey} has been set. Check twice if set value is correct.`);
  };
  dotenv.config();

  getEnvironmentValue('WP_API_USERNAME');
  getEnvironmentValue('WP_API_PASSWORD');
  getEnvironmentValue('WP_URL');
  getEnvironmentValue('STORIES_ROOT');

  printTestFooter(ExamplesTypes.DOTENV_CONFIG);
}

function yamlParserExample(): void {
  printTestHeader(ExamplesTypes.YAML);

  const firstYaml = readFileSync('./files_for_examples/yaml/first_example.yaml', 'utf8');
  const firstParsedYaml = yamlParse(firstYaml);
  assert(
    yamlStringify(firstParsedYaml) === yamlStringify({ number: 3, plain: 'string', block: 'two\nlines' }),
    '❌ First yaml example not parsed properly!'
  );
  console.log('✔️  First yaml parsed properly');

  const secondYaml = readFileSync('./files_for_examples/yaml/second_example.yaml', 'utf8');
  const secondParsedYaml = yamlParse(secondYaml);
  assert(
    yamlStringify(secondParsedYaml) === yamlStringify([true, false, 'maybe', null]),
    '❌ Second yaml example not parsed properly!'
  );
  console.log('✔️  Second yaml parsed properly');

  printTestFooter(ExamplesTypes.YAML);
}

function markdownParserExample(): void {
  printTestHeader(ExamplesTypes.MD);

  const exampleMarkdown = readFileSync('./files_for_examples/md/example.md', 'utf8');

  // Enable HTML tags in source
  const options = { html: true };
  const md = new MarkdownIt(options);
  const properlyParsedMarkdown =
    '<h1>Header</h1>\n<ul>\n<li>a</li>\n<li><strong>b</strong></li>\n<li><em>c</em></li>\n</ul>\n<div data-solution="ABC"></div>';

  assert(
    JSON.stringify(properlyParsedMarkdown) === JSON.stringify(md.render(exampleMarkdown)),
    '❌ Markdown not parsed properly!'
  );
  console.log('✔️  Markdown parsed properly');

  printTestFooter(ExamplesTypes.MD);
}

function exampleLinkeDOM(): void {
  printTestHeader(ExamplesTypes.LINKEDOM);

  const exampleHtml = readFileSync('./files_for_examples/html/example.html', 'utf8');

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
  const TEXT_NODE = 3;

  const document = new DOMParser().parseFromString(exampleHtml, 'text/html');

  // replace text nodes
  const paragraphs = document.querySelectorAll('p');
  assert(paragraphs != null, "❌ paragraphs don't exist!");

  paragraphs.forEach((paragraph: HTMLParagraphElement) => {
    paragraph.childNodes.forEach((node: ChildNode) => {
      if (node.nodeType === TEXT_NODE) {
        // eslint-disable-next-line no-param-reassign
        node.textContent = `[${node.textContent as string}]`;
      }
    });
  });

  // replace nodes with specific attributes
  const solutionNode = document.querySelector('div[data-solution]');
  assert(solutionNode != null, "❌ Story solution value doesn't exist!");
  console.log('✔️  Solution node read');

  assert(solutionNode.getAttribute('data-solution') === 'ABC', '❌ Story solution value not provided!');
  console.log('✔️  Solution value properly read from attribute');

  solutionNode.innerHTML = '<p>Yay</p>';
  assert(
    JSON.stringify(document.documentElement.innerHTML).includes('Yay'),
    '❌ Story solution value was not added properly!'
  );
  console.log('✔️  Story solution properly added');

  const properHtmlOutput =
    '\n    <p>[a b c]</p>\n    <p>[d e]</p>\n    <p>[f ]<strong>strong</strong>[ g]</p>\n    <div' +
    ' data-solution="ABC"><p>Yay</p></div>\n';
  console.log(JSON.stringify(document.documentElement.innerHTML));
  assert(
    JSON.stringify(properHtmlOutput) === JSON.stringify(document.documentElement.innerHTML),
    '❌ HTML not parsed properly!'
  );
  console.log('✔️  HTML properly parsed');

  printTestFooter(ExamplesTypes.LINKEDOM);
}

function exampleFormData(): void {
  printTestHeader(ExamplesTypes.FORM_DATA);
  const form = new FormData();
  form.append('title', 'Hello World');
  form.append('x', 'this is x');
  form.append('y', 'this is y');

  assert(form.getHeaders()['content-type'].includes('multipart/form-data'), '❌ FormData headers not set properly!');
  assert(form.getBuffer().length, '❌ Buffer is empty!');

  assert(
    form.getBuffer().toString().includes('Content-Disposition: form-data; name="title"') &&
      form.getBuffer().toString().includes('Hello World'),
    '❌ title field not set properly!'
  );
  console.log('✔️  title field properly set');

  assert(
    form.getBuffer().toString().includes('Content-Disposition: form-data; name="x"') &&
      form.getBuffer().toString().includes('this is x'),
    '❌ x field not set properly!'
  );
  console.log('✔️  x field properly set');

  assert(
    form.getBuffer().toString().includes('Content-Disposition: form-data; name="y"') &&
      form.getBuffer().toString().includes('this is y'),
    '❌ y field not set properly!'
  );
  console.log('✔️  y field properly set');

  printTestFooter(ExamplesTypes.FORM_DATA);
}

dotenvExample();
await httpExample();
yamlParserExample();
markdownParserExample();
exampleLinkeDOM();
exampleFormData();
