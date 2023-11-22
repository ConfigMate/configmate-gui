import { TextDocument } from "vscode-languageserver-textdocument";
import { SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend } from "vscode-languageserver/node";
import { getSemanticTokens } from "./api";
import { tokenResponse, SemanticToken } from "./models";

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

export const legend = (function () {
    const tokenTypesLegend = [
        'keyword', 
        'variable', 
        'property',
        'type', 
        'decorator',
        'method',
        'string',
        'number', 
        'operator'
    ];
    tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

    const tokenModifiersLegend = ['declaration', 'documentation'];
    tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

    return <SemanticTokensLegend>({
        tokenTypes: tokenTypesLegend, 
        tokenModifiers: tokenModifiersLegend
    });
})();

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

    async provideDocumentSemanticTokens(document: TextDocument): Promise<SemanticTokens> {
        const fileContents = document.getText();
        const allTokens = await this.tokenizeCMSDocument(fileContents);
        const builder = new SemanticTokensBuilder();
        allTokens.forEach((token: SemanticToken) => {
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

    private tokenizeCMSDocument = async (fileContents: string): Promise<SemanticToken[]> => {
        const response: tokenResponse = await getSemanticTokens(fileContents);
        if (!response) return;
        if (response.error) console.error(response.error);
        if (!response.semantic_tokens) return [];
        
        // console.log(response);
        
        const tokens: SemanticToken[] = [];
        const { semantic_tokens } = response;
        semantic_tokens.forEach(token => {
            tokens.push({
                line: token.line,
                startCharacter: token.column,
                length: token.length,
                tokenType: token.tokenType,
                tokenModifiers: []
            });
        });
        return tokens;
    }
}