# Terraform Plan Formatter Action

![GitHub release (latest by date)](https://img.shields.io/github/v/release/AnassKartit/terraform-plan-formatter-action)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/AnassKartit/terraform-plan-formatter-action/main.yml?branch=main)
![License](https://img.shields.io/github/license/AnassKartit/terraform-plan-formatter-action)

A GitHub Action that formats Terraform plan output into a readable summary table, making it easier to review infrastructure changes in your CI/CD pipeline.

## Features

- 📊 Summarizes Terraform plan output in a clear, tabular format
- 🔍 Shows count of resources to be created, updated, and destroyed
- 📝 Lists affected resources with their respective actions
- 🚀 Integrates seamlessly with GitHub Actions workflows

## Usage

To use this action in your workflow, add the following step:

```yaml
- name: Format Terraform Plan
  uses: AnassKartit/terraform-plan-formatter-action@v1
  with:
    plan_output: ${{ steps.terraform_plan.outputs.stdout }}
```

Make sure you have a step that runs `terraform plan` and captures its output before using this action.

### Full Example

Here's a complete workflow example:

```yaml
name: Terraform Plan

on: [push, pull_request]

jobs:
  terraform:
    name: 'Terraform'
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v2

    - name: Setup Terraform
      uses: hashicorp/setup-terraform@v1

    - name: Terraform Init
      run: terraform init

    - name: Terraform Plan
      run: terraform plan -no-color
      continue-on-error: true
      id: plan

    - name: Format Terraform Plan
      uses: AnassKartit/terraform-plan-formatter-action@v1
      with:
        plan_output: ${{ steps.plan.outputs.stdout }}

    - name: Post Plan Summary
      uses: actions/github-script@v6
      if: github.event_name == 'pull_request'
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          const output = `#### Terraform Plan Summary
          ${{ steps.format-terraform-plan.outputs.summary }}
          `;
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.name,
            body: output
          })
```

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `plan_output` | The output of `terraform plan` | Yes |

## Outputs

| Output | Description |
|--------|-------------|
| `summary` | A formatted markdown table summarizing the Terraform plan |

## Example Output

Here's an example of what the formatted output looks like:

```markdown
## Terraform Plan Summary

| Action | Count |
|--------|-------|
| Create | 2     |
| Update | 1     |
| Destroy| 1     |

## Affected Resources

| Action | Resource |
|--------|----------|
| create | aws_instance.example |
| create | aws_s3_bucket.data |
| update | aws_security_group.allow_tls |
| destroy| aws_nat_gateway.example |
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.