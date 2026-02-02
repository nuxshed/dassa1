{
  description = "dev env for dass a1";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            mongodb
          ];

          shellHook = ''
            echo "node version: $(node --version)"
            echo "mongo version: $(mongod --version | grep 'db version')"
          '';
        };
      }
    );
}
