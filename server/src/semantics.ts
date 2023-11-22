import { TextDocument } from "vscode-languageserver-textdocument";
import { SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend } from "vscode-languageserver/node";

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

export const legend = (function () {
    const tokenTypesLegend = ['keyword', 'type', 'variable', 'operator', 'number', 'string'];
    tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

    const tokenModifiersLegend = ['declaration', 'documentation'];
    tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

    return <SemanticTokensLegend>({
        tokenTypes: tokenTypesLegend, 
        tokenModifiers: tokenModifiersLegend
    });
})();

interface Token {
    line: number;
    startCharacter: number;
    length: number;
    tokenType: string;
    tokenModifiers: string[];
}

export class SemanticTokensManager {  
    tokenSpecs = [
        { regex: /\b(?:file|spec|type|default|description|notes)\b/g, type: 'keyword' },
        { regex: /\b[A-Za-z_][A-Za-z0-9_]*\b/g, type: 'label' },
        { regex: /\b\d+(\.\d+)?\b/g, type: 'number' },
        { regex: /["][A-Za-z0-9_,.?!// ]*["]/g, type: 'string' },
        { regex: /[=+\-;:,.]/g, type: 'operator' },
        { regex: /\b(?:true|false)\b/g, type: 'enum' },
        // Add more patterns if necessary
    ];

    provideDocumentSemanticTokens(document: TextDocument): SemanticTokens {
        const allTokens = this.tokenizeCMSDocument(document.getText());
        const builder = new SemanticTokensBuilder();
        allTokens.forEach((token) => {
            builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers));
        });
        return builder.build();
    }

    private _encodeTokenType(tokenType: string): number {
        if (tokenTypes.has(tokenType)) {
            return tokenTypes.get(tokenType)!;
        } else if (tokenType === 'notInLegend') {
            return tokenTypes.size + 2;
        }
        return 0;
    }

    private _encodeTokenModifiers(strTokenModifiers: string[]): number {
        let result = 0;
        for (let i = 0; i < strTokenModifiers.length; i++) {
            const tokenModifier = strTokenModifiers[i];
            if (tokenModifiers.has(tokenModifier)) {
                result = result | (1 << tokenModifiers.get(tokenModifier)!);
            } else if (tokenModifier === 'notInLegend') {
                result = result | (1 << tokenModifiers.size + 2);
            }
        }
        return result;
    }

    private tokenizeCMSDocument = (text: string): Token[] => {

        const tokens: Token[] = [];
        let line = 0;
        let match;
        text.split(/\r?\n/).forEach(lineText => {
            let startCharacter = 0;
            while (lineText.length > 0) {
                let matched = false;
                for (const { regex, type } of this.tokenSpecs) {
                    match = regex.exec(lineText);
                    if (match) {
                        matched = true;
                        const length = match[0].length;
                        startCharacter = lineText.indexOf(match[0]);
                        // console.log(match[0]);
                        const tokenData = this._parseTextToken(match[0]);
                        tokens.push({
                            line, 
                            startCharacter, 
                            length, 
                            tokenType: type, 
                            tokenModifiers: tokenData.tokenModifiers 
                        });
                        startCharacter += length;
                        // lineText = lineText.slice(startCharacter);
                        // break;
                    }
                }
                if (!matched)
                    lineText = lineText.slice(1);
            }
            line++;
        });
        return tokens;
    }

    private _parseTextToken(text: string): { tokenType: string; tokenModifiers: string[]; } {
        const parts = text.split('.');
        return {
            tokenType: parts[0],
            tokenModifiers: parts.slice(1)
        };
    }

}