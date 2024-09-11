const core = require('@actions/core');
const mainScript = require('../index');

jest.mock('@actions/core');

describe('parseTerraformPlan', () => {
  test('correctly parses create, update, and destroy actions', () => {
    const planOutput = `
+ resource "aws_instance" "example" {
    # (create)
}
~ resource "aws_security_group" "example" {
    # (update)
}
- resource "aws_s3_bucket" "example" {
    # (destroy)
}
    `;

    const result = mainScript.parseTerraformPlan(planOutput);

    expect(result.create).toBe(1);
    expect(result.update).toBe(1);
    expect(result.destroy).toBe(1);
    expect(result.resources).toHaveLength(3);
    expect(result.resources[0]).toEqual({ action: 'create', resource: 'resource "aws_instance" "example" {' });
    expect(result.resources[1]).toEqual({ action: 'update', resource: 'resource "aws_security_group" "example" {' });
    expect(result.resources[2]).toEqual({ action: 'destroy', resource: 'resource "aws_s3_bucket" "example" {' });
  });

  test('handles empty plan output', () => {
    const result = mainScript.parseTerraformPlan('');

    expect(result.create).toBe(0);
    expect(result.update).toBe(0);
    expect(result.destroy).toBe(0);
    expect(result.resources).toHaveLength(0);
  });
});

describe('generateMarkdownTable', () => {
  test('generates correct markdown table', () => {
    const summary = {
      create: 1,
      update: 2,
      destroy: 3,
      resources: [
        { action: 'create', resource: 'aws_instance.example' },
        { action: 'update', resource: 'aws_security_group.example1' },
        { action: 'update', resource: 'aws_security_group.example2' },
        { action: 'destroy', resource: 'aws_s3_bucket.example1' },
        { action: 'destroy', resource: 'aws_s3_bucket.example2' },
        { action: 'destroy', resource: 'aws_s3_bucket.example3' },
      ]
    };

    const result = mainScript.generateMarkdownTable(summary);

    expect(result).toContain('| Create | 1 |');
    expect(result).toContain('| Update | 2 |');
    expect(result).toContain('| Destroy | 3 |');
    expect(result).toContain('| create | aws_instance.example |');
    expect(result).toContain('| update | aws_security_group.example1 |');
    expect(result).toContain('| update | aws_security_group.example2 |');
    expect(result).toContain('| destroy | aws_s3_bucket.example1 |');
    expect(result).toContain('| destroy | aws_s3_bucket.example2 |');
    expect(result).toContain('| destroy | aws_s3_bucket.example3 |');
  });
});

describe('run function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processes plan output and sets action output', async () => {
    const planOutput = `
+ resource "aws_instance" "example" {
    # (create)
}
- resource "aws_s3_bucket" "example" {
    # (destroy)
}
    `;

    core.getInput.mockReturnValue(planOutput);

    const setOutputMock = jest.spyOn(core, 'setOutput');
    const summaryMock = {
      addRaw: jest.fn().mockReturnThis(),
      write: jest.fn().mockResolvedValue(undefined),
    };
    core.summary = summaryMock;

    await mainScript.run();

    expect(setOutputMock).toHaveBeenCalledWith('summary', expect.stringContaining('| Create | 1 |'));
    expect(setOutputMock).toHaveBeenCalledWith('summary', expect.stringContaining('| Destroy | 1 |'));
    expect(summaryMock.addRaw).toHaveBeenCalledWith(expect.stringContaining('| Create | 1 |'));
    expect(summaryMock.write).toHaveBeenCalled();
  });

  test('handles errors', async () => {
    const error = new Error('Test error');
    core.getInput.mockImplementation(() => {
      throw error;
    });

    const setFailedMock = jest.spyOn(core, 'setFailed');

    await mainScript.run();

    expect(setFailedMock).toHaveBeenCalledWith('Test error');
  });
});