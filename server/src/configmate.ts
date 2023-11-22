import { Connection } from 'vscode-languageserver/node';
import path = require('path');
import { spawn, ChildProcess } from 'child_process';

export class ConfigMateManager {
	private isShuttingDown = false;
	private maxRestartAttempts = 3;
	private restartAttempts = 0;
	private cmProcess: ChildProcess | null = null;

	constructor(connection: Connection) {
		this.startCMProcess(connection);
	}

	public startCMProcess = (connection: Connection) => {
		if (this.isShuttingDown || this.restartAttempts >= this.maxRestartAttempts) return;

		const cliPath = path.resolve(__dirname, '../../configmate');
		this.cmProcess = spawn(
			'./bin/configm',
			['serve'],
			{
				cwd: cliPath,
				shell: true
			}
		);

		this.cmProcess?.stdout?.on('data', () => {
			// connection.console.log(data as string);
		});

		this.cmProcess?.stderr?.on('data', (data) => {
			connection.console.error(`ANTLR CLI error: ${data as string}`);
		});

		this.cmProcess?.on('close', () => {
			this.reset();
		});
	}

	private cleanUpCMProcess = () => {
		if (this.cmProcess && !this.cmProcess.killed && this.cmProcess.pid) {
			process.kill(-this.cmProcess.pid, 'SIGKILL');
			this.cmProcess = null;
		}
	}

	private reset = () => {
		this.isShuttingDown = false;
		this.restartAttempts = 0;
	};

	public handleShutdown = () => {
		this.isShuttingDown = true;
		this.cleanUpCMProcess();
	};
}