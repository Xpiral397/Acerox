"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Database,
  Globe,
  HardDrive,
  Upload,
  Settings,
  RefreshCw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { repositoryManager } from "@/services/font-repositories/repository-manager";
import type { FontRepository } from "@/types/font-repository";

interface RepositoryStats {
  enabled: boolean;
  fontCount: number;
  capabilities?: any;
  name?: string;
  description?: string;
  error?: string;
}

export default function RepositorySelector() {
  const [repositories, setRepositories] = useState<FontRepository[]>([]);
  const [stats, setStats] = useState<Record<string, RepositoryStats>>({});
  const [loading, setLoading] = useState(true);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);

  // Load repositories and stats
  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const repos = repositoryManager.getRepositories();
      const repoStats = await repositoryManager.getStats();

      setRepositories(repos);
      setStats(repoStats);
    } catch (error) {
      console.error("Error loading repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRepository = async (id: string, enabled: boolean) => {
    repositoryManager.toggleRepository(id, enabled);

    // Update local state
    setRepositories(
      repositories.map((repo) =>
        repo.id === id ? { ...repo, enabled } : repo
      )
    );

    // Refresh stats
    await loadRepositories();
  };

  const handleRefreshCache = async (id?: string) => {
    repositoryManager.clearCache(id);
    await loadRepositories();
  };

  const getRepositoryIcon = (type: string) => {
    switch (type) {
      case "api":
        return <Globe className="h-5 w-5" />;
      case "database":
        return <Database className="h-5 w-5" />;
      case "cdn":
        return <HardDrive className="h-5 w-5" />;
      case "custom":
        return <Upload className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const totalFonts = Object.values(stats).reduce(
    (acc, stat) => acc + (stat.enabled ? stat.fontCount : 0),
    0
  );

  const enabledCount = repositories.filter((repo) => repo.enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Font Repositories</h3>
        <p className="text-sm text-muted-foreground">
          Manage font sources and access thousands of fonts
        </p>
      </div>

      {/* Stats Summary */}
      <Card className="p-4 bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{totalFonts.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Available Fonts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{enabledCount}</div>
            <div className="text-xs text-muted-foreground">Active Repositories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{repositories.length}</div>
            <div className="text-xs text-muted-foreground">Total Repositories</div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleRefreshCache()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <Separator />

      {/* Repository List */}
      <div className="space-y-3">
        {repositories.map((repo) => {
          const stat = stats[repo.id];
          const isExpanded = expandedRepo === repo.id;

          return (
            <Card key={repo.id} className="overflow-hidden">
              {/* Repository Header */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon + Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-muted-foreground">
                      {getRepositoryIcon(repo.type)}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{repo.name}</h4>
                        <Badge variant={repo.enabled ? "default" : "secondary"} className="text-xs">
                          {repo.type.toUpperCase()}
                        </Badge>
                        {stat?.error && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {repo.description}
                      </p>
                      {repo.enabled && stat && !stat.error && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{stat.fontCount.toLocaleString()} fonts</span>
                          {repo.capabilities.search && (
                            <Badge variant="outline" className="gap-1">
                              <Check className="h-3 w-3" />
                              Search
                            </Badge>
                          )}
                          {repo.capabilities.categories && (
                            <Badge variant="outline" className="gap-1">
                              <Check className="h-3 w-3" />
                              Categories
                            </Badge>
                          )}
                          {repo.capabilities.variants && (
                            <Badge variant="outline" className="gap-1">
                              <Check className="h-3 w-3" />
                              Variants
                            </Badge>
                          )}
                        </div>
                      )}
                      {stat?.error && (
                        <p className="text-xs text-destructive">{stat.error}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={repo.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleRepository(repo.id, enabled)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRepo(isExpanded ? null : repo.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Configuration */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Separator />
                    <div className="p-4 bg-muted/20 space-y-4">
                      <h5 className="text-sm font-semibold flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configuration
                      </h5>

                      {/* API Key Configuration (if applicable) */}
                      {repo.type === "api" && (
                        <div className="space-y-2">
                          <Label htmlFor={`${repo.id}-api-key`} className="text-xs">
                            API Key (Optional)
                          </Label>
                          <Input
                            id={`${repo.id}-api-key`}
                            type="password"
                            placeholder="Enter API key for higher rate limits"
                            defaultValue={repo.config?.apiKey || ""}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Works without API key, but may have rate limits
                          </p>
                        </div>
                      )}

                      {/* Capabilities */}
                      <div className="space-y-2">
                        <Label className="text-xs">Capabilities</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(repo.capabilities).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 text-xs"
                            >
                              {value ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <X className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="capitalize">{key}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefreshCache(repo.id)}
                          className="gap-2"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Refresh Cache
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Add Custom Repository (Future) */}
      <Card className="p-4 border-dashed">
        <div className="text-center space-y-2">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <h4 className="font-semibold text-sm">Add Custom Repository</h4>
          <p className="text-xs text-muted-foreground">
            Upload your own fonts or connect to custom font sources
          </p>
          <Button variant="outline" size="sm" disabled>
            Coming Soon
          </Button>
        </div>
      </Card>
    </div>
  );
}
