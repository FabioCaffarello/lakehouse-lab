variable "aws_region" {
  description = "The AWS region to deploy the resources"
  type        = string
  nullable    = false
}

variable "aws_vpc_name" {
  description = "The name of the VPC"
  type        = string
  nullable    = false
}

variable "aws_vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  nullable    = false
}

variable "aws_vpc_azs" {
  description = "The availability zones for the VPC"
  type        = set(string)
  nullable    = false
}

variable "aws_vpc_private_subnets" {
  description = "The CIDR blocks for the private subnets"
  type        = set(string)
  nullable    = false
}

variable "aws_vpc_public_subnets" {
  description = "The CIDR blocks for the public subnets"
  type        = set(string)
  nullable    = false
}

variable "aws_eks_name" {
  description = "The name of the EKS cluster"
  type        = string
  nullable    = false
}

variable "aws_eks_version" {
  description = "The version of the EKS cluster"
  type        = string
  nullable    = false
}

variable "aws_eks_managed_node_groups_instance_types" {
  description = "The instance types for the EKS managed node groups"
  type        = set(string)
  nullable    = false
}

variable "aws_project_tags" {
  description = "The tags to apply to the resources"
  type        = map(string)
  nullable    = false
}
