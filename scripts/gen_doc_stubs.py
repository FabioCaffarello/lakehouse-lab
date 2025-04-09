import json
from pathlib import Path

import mkdocs_gen_files

src_root = Path(".")


def process_patterns(project_path, custom_patterns):
    for pattern in custom_patterns:
        for path in src_root.glob(pattern):
            doc_path = Path("reference", path.relative_to(src_root))
            with mkdocs_gen_files.open(doc_path, "wb") as f:
                f.write(path.read_bytes())

            if not path.suffix.endswith(".jpg") and not path.suffix.endswith(".png"):
                mkdocs_gen_files.set_edit_path(doc_path, f"../{path}")


# Process parent directories containing multiple projects
def walk_and_process_parent_dir(project_path):
    parent_path = project_path.parent
    while (
        parent_path != src_root.joinpath("libs")
        and path != src_root.joinpath("services")
        and path != src_root.joinpath("chalanges")
    ):
        dir_path = str(parent_path)
        if parent_path == src_root:
            break

        # Process the parent directory's README
        custom_patterns = [
            f"{dir_path}/README.md",
        ]
        process_patterns(dir_path, custom_patterns)

        parent_path = parent_path.parent


# Process individual projects
for path in src_root.rglob("project.json"):
    walk_and_process_parent_dir(path.parent)

    project_path = str(path.parent)
    with open(path, "r") as project_file:
        project = json.loads(project_file.read())
        custom_patterns = [
            # OpenAPI Specs
            f"{project_path}/docs/openapi/*.json",
            f"{project_path}/docs/openapi/*.yml",
            f"{project_path}/docs/openapi/*.md",
            # godoc
            f"{project_path}/docs/*.md",
            # Markdowns
            f"{project_path}/*.md",
            # Images
            f"{project_path}/docs/**/*.jpg",
            f"{project_path}/docs/**/*.png",
        ]

        process_patterns(project_path, custom_patterns)
