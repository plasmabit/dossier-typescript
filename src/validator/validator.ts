import { Kind, type Dossier, type DossierArray, type DossierValue } from '@types';

export class Validator {
	private dossier: Dossier;

	constructor(dossier: Dossier) {
		this.dossier = dossier;
	}

	private makeChildPath(path: string, dossier: Dossier, index?: number): string {
		if (dossier.identifier) {
			return path === '(root)' ? dossier.identifier.value.value : `${path}.${dossier.identifier.value.value}`;
		}

		if (index === undefined) {
			return `${path}.(anonymous)`;
		}

		return `${path}[${index}]`;
	}

	private validateArray(array: DossierArray, path: string): void {
		for (let i = 0; i < array.value.length; i++) {
			const item = array.value[i];

			if (item.kind === Kind.dossier) {
				this.validateDossier(item, this.makeChildPath(path, item, i));
				continue;
			}

			this.validateValue(item, `${path}[${i}]`);
		}
	}

	private validateValue(value: DossierValue, path: string): void {
		if (value.kind === Kind.array) {
			this.validateArray(value, path);
		}
	}

	private validateChildren(dossiers: Dossier[], path: string): void {
		const identifiers = new Set<string>();

		for (let i = 0; i < dossiers.length; i++) {
			const dossier = dossiers[i];
			const identifier = dossier.identifier?.value.value;

			if (identifier) {
				if (identifiers.has(identifier)) {
					throw new Error(`Duplicate identifier "${identifier}" under ${path}`);
				}

				identifiers.add(identifier);
			}

			this.validateDossier(dossier, this.makeChildPath(path, dossier, i));
		}
	}

	private validateDossier(dossier: Dossier, path: string): void {
		if (dossier.value) {
			this.validateValue(dossier.value, path);
		}

		if (dossier.children) {
			this.validateChildren(dossier.children.value, path);
		}
	}

	public validate(): Dossier {
		this.validateDossier(this.dossier, '(root)');

		return this.dossier;
	}
}
