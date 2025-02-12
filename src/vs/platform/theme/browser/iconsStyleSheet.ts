/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { asCSSPropertyValue, asCSSUrl } from 'vs/base/browser/dom';
import { Emitter, Event } from 'vs/base/common/event';
import { getIconRegistry, IconContribution, IconFontContribution } from 'vs/platform/theme/common/iconRegistry';


export interface IIconsStyleSheet {
	getCSS(): string;
	readonly onDidChange: Event<void>;
}

export function getIconsStyleSheet(): IIconsStyleSheet {
	const onDidChangeEmmiter = new Emitter<void>();
	const iconRegistry = getIconRegistry();
	iconRegistry.onDidChange(() => onDidChangeEmmiter.fire());

	return {
		onDidChange: onDidChangeEmmiter.event,
		getCSS() {
			const usedFontIds: { [id: string]: IconFontContribution } = {};
			const formatIconRule = (contribution: IconContribution): string | undefined => {
				const definition = IconContribution.getDefinition(contribution, iconRegistry);
				if (!definition) {
					return undefined;
				}
				const fontId = definition.fontId;
				if (fontId) {
					const fontContribution = iconRegistry.getIconFont(fontId);
					if (fontContribution) {
						usedFontIds[fontId] = fontContribution;
						return `.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; font-family: ${asCSSPropertyValue(fontId)}; }`;
					}
				}
				return `.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; }`;
			};

			const rules = [];
			for (let contribution of iconRegistry.getIcons()) {
				const rule = formatIconRule(contribution);
				if (rule) {
					rules.push(rule);
				}
			}
			for (let id in usedFontIds) {
				const fontContribution = usedFontIds[id];
				const src = fontContribution.definition.src.map(l => `${asCSSUrl(l.location)} format('${l.format}')`).join(', ');
				rules.push(`@font-face { src: ${src}; font-family: ${asCSSPropertyValue(id)}; font-display: block; }`);
			}
			return rules.join('\n');
		}
	};
}
