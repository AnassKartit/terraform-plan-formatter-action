const core = require('@actions/core');
const github = require('@actions/github');

function parseTerraformPlan(planOutput) {
  const summary = {
    create: 0,
    destroy: 0,
    update: 0,
    resources: []
  };

  const lines = planOutput.split('\n');
  for (const line of lines) {
    if (line.startsWith('  + ')) {
      summary.create++;
      summary.resources.push({ action: 'create', resource: line.substring(4) });
    } else if (line.startsWith('  - ')) {
      summary.destroy++;
      summary.resources.push({ action: 'destroy', resource: line.substring(4) });
    } else if (line.startsWith('  ~ ')) {
      summary.update++;
      summary.resources.push({ action: 'update', resource: line.substring(4) });
    }
  }

  return summary;
}

function generateMarkdownTable(summary) {
  let markdown = '## Terraform Plan Summary\n\n';
  markdown += '| Action | Count |\n';
  markdown += '|--------|-------|\n';
  markdown += `| Create | ${summary.create} |\n`;
  markdown += `| Destroy | ${summary.destroy} |\n`;
  markdown += `| Update | ${summary.update} |\n\n`;

  markdown += '## Affected Resources\n\n';
  markdown += '| Action | Resource |\n';
  markdown += '|--------|----------|\n';
  for (const resource of summary.resources) {
    markdown += `| ${resource.action} | ${resource.resource} |\n`;
  }

  return markdown;
}

async function run() {
  try {
    const planOutput = core.getInput('plan_output');
    const summary = parseTerraformPlan(planOutput);
    const markdownTable = generateMarkdownTable(summary);

    core.setOutput('summary', markdownTable);

    // Create a summary on the Actions tab
    await core.summary
      .addRaw(markdownTable)
      .write();

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
