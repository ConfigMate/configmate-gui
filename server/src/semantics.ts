import { TextDocument } from "vscode-languageserver-textdocument";
import { SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend } from "vscode-languageserver/node";
import { getSemanticTokens } from "./api";
import { SemanticTokenResponse, SemanticToken } from "./models";

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
    async provideDocumentSemanticTokens(document: TextDocument): Promise<SemanticTokens> {
        const fileContents = document.getText();
        const allTokens = await this.tokenizeCMSDocument(fileContents);
        const builder = new SemanticTokensBuilder();
        allTokens.forEach((token: SemanticToken) => {
            const {line, startCharacter, length, tokenType} = token;
            builder.push(
                line, startCharacter, length, 
                this._encodeTokenType(tokenType), this._encodeTokenModifiers([])
            );
        });
        return builder.build();
    }

    private _encodeTokenType(tokenType: string): number {
        if (tokenTypes.has(tokenType))
            return tokenTypes.get(tokenType)!;
        else if (tokenType === 'notInLegend')
            return tokenTypes.size + 2;
        return 0;
    }

    // Not currently using this, but leaving here in case we need it later
    private _encodeTokenModifiers(strTokenModifiers: string[]): number {
        let result = 0;
        for (let i = 0; i < strTokenModifiers.length; i++) {
            const tokenModifier = strTokenModifiers[i];
            if (tokenModifiers.has(tokenModifier))
                result = result | (1 << tokenModifiers.get(tokenModifier)!);
            else if (tokenModifier === 'notInLegend')
                result = result | (1 << tokenModifiers.size + 2);
        }
        return result;
    }

    private tokenizeCMSDocument = async (fileContents: string): Promise<SemanticToken[]> => {
        const response: SemanticTokenResponse = await getSemanticTokens(fileContents);
        if (!response) return;
        if (response.error) console.error(response.error);
        if (!response.semantic_tokens) return [];
        
        console.log(response);
        
        const tokens: SemanticToken[] = [];
        const { semantic_tokens } = response;
        semantic_tokens.forEach(token => {
            const { line, column: startCharacter, length, tokenType} = token;
            tokens.push({line, startCharacter, length, tokenType, tokenModifiers: []});
        });
        return tokens;
    }
}